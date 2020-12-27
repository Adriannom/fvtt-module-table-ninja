import * as config from "./config.js";

class TableNinja extends Application {

    id = "tninja-prime";
    title = "Table Ninja";
    template = config.templatePaths.main;
    folderName = "Table Ninja";

    static get defaultOptions() {
        const options = super.defaultOptions
        options.width = 666;
        options.height = 666;
        options.resizable = true;
        return options;
    }

    getData() {
        return {
            data: this.data
        }
    }

    constructor(options = {}) {
        super(options);

        // Set this.data to the main Table Ninja folder.
        this.data = game.folders.filter(x => x.data.type == "RollTable").find(b => b.name === this.folderName);
        if (!this.data) {
            // Folder doesn't exist, so create it.
            console.debug("Creating folder");
            Folder.create(
                {
                  name: this.folderName,
                  type: "RollTable",
                  parent: null
                },
                { displaySheet: false }
            ).then((promise) => {
                // Initialise the rest of the data tree when done.
                this.data = promise;
                this.refresh();
            });
        } else {
            // Initialise the data tree.
            this.refresh();
        }
        this.tabs = new Tabs({navSelector: ".tabs", contentSelector: ".content", initial: "tab1"});
        //this.tabs.bind(html);
    }

    toggleOpen() {

        // Clicking on the button toggles the application view.
        if (game.user.isGM) {
            if (this.rendered) {
                this.close();
            } else {
                this.render(true);
            }
        }

    }

    async refresh() {
        this.initData(this.data).then((promise) => {
            this.data = promise;
            this.render();
        });
    }

    async initData(folder = null) {

        let tables = folder.content;
        let subFolders = folder.children;
        folder.isFolder = true;
        
        // Erase child entities and combine folders and tables.
        folder.childEntities = [];
        if (typeof subFolders !== 'undefined') {
            for (let i = 0; i < subFolders.length; i++) {
                let subFolder = subFolders[i];
                // Recurse with subfolders.
                this.initData(subFolder).then((promise) => {
                    folder.childEntities.push(promise);
                })
            }
        }
        if (typeof tables !== 'undefined') {
            for (let i = 0; i < tables.length; i++) {
                let table = tables[i];
                if (typeof table.ninjaRoll === "undefined") {
                    // Add a special roll function to the table.
                    table.ninjaRoll = async function () {
                        return this.drawMany(config.numberOfRolls, {displayChat: false}).then((promise) => {
                            this.rolls = promise.results;
                            this.selected = 0;
                            return this;
                        });
                    }
                }
                // Preroll a list of results from the table.
                table.ninjaRoll().then((promise) => {
                    folder.childEntities.push(promise);
                });
            }
        }

        return folder;
    
    }

    rollOneTable(id) {
        let table = game.tables.find(b => b.id === id);
        table.ninjaRoll().then(() => {
            this.render();
        });
    }

    choose(id) {
        // Bring up the list of prerolled results from the table so the user can choose one.
        let element = document.getElementById(id);
        element.classList.add("tninja-choosing");
        if (element.selected > 0) {
            let selected = document.querySelector("#" + id + " .tninja-selected");
            selected.scrollIntoView();
        }
    }

    updateText(id, index, newText) {
        document.getElementById("tninja-text-" + id).innerHTML = newText;
        document.getElementById("tninja-choose-" + id).classList.remove('tninja-choosing');
        let table = game.tables.find(b => b.id === id);
        table.selected = index;
        this.render();
    }

}

Hooks.on("renderSceneControls", async (app, html, data) => {

    // Add a button to the scene controls for quick access. Using @errational's hack to avoid adding a layer. May break at some point.
    const tableNinjaButtonHtml = await renderTemplate(`modules/table-ninja/templates/button.hbs`);
    html.append(tableNinjaButtonHtml);
    const tableNinjaButton = html.find("li[data-control='table-ninja']");
    tableNinjaButton.on("click", event => ui.tableNinja.toggleOpen());

});

Hooks.once('ready', async function() {
    ui.tableNinja = new TableNinja();
});

Hooks.once("init", function () {
    preloadHandlebarsTemplates();
});

async function preloadHandlebarsTemplates() {
    return loadTemplates(Object.values(config.templatePaths));
};

Handlebars.registerHelper('tableNinjaSelectedText', function (table) {
    return table.rolls[table.selected].text;
})

Handlebars.registerHelper('ifCond', function (v1, operator, v2, options) {

    switch (operator) {
        case '==':
            return (v1 == v2) ? options.fn(this) : options.inverse(this);
        case '===':
            return (v1 === v2) ? options.fn(this) : options.inverse(this);
        case '!=':
            return (v1 != v2) ? options.fn(this) : options.inverse(this);
        case '!==':
            return (v1 !== v2) ? options.fn(this) : options.inverse(this);
        case '<':
            return (v1 < v2) ? options.fn(this) : options.inverse(this);
        case '<=':
            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
        case '>':
            return (v1 > v2) ? options.fn(this) : options.inverse(this);
        case '>=':
            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
        case '&&':
            return (v1 && v2) ? options.fn(this) : options.inverse(this);
        case '||':
            return (v1 || v2) ? options.fn(this) : options.inverse(this);
        default:
            return options.inverse(this);
    }

});