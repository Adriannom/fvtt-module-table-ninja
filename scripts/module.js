import {TEMPLATE_PATHS} from "./config.js";

class TableNinja extends Application {

    template = TEMPLATE_PATHS.main;
    tableNinjaFolderName = "Table Ninja";
    numberToDraw = 30;

    static get defaultOptions() {
        const options = super.defaultOptions
        options.width = 300;
        options.height= 500;
        options.resizable = true;
        return options;
    }

    getData() {
        return {
            data: this.data,
            partials: TEMPLATE_PATHS
        }
    }

    constructor(options = {}) {
        super(options);
        this.tableNinjaFolder = game.folders.filter(x => x.data.type == "RollTable").find(b => b.name === this.tableNinjaFolderName);
        this.refresh();
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

    refresh() {

        // Retrieve everything from the table folder "Table Ninja".
        this.data = this.fetchTables(this.tableNinjaFolder);
    
        this.render();

    }

    fetchTables(requestedFolder) {

        const tables = requestedFolder.content;
        const folders = requestedFolder.children;
        let output = [];

        // Roll many times on each table.
        for (let i = 0; i < tables.length; i++) {
            let table = tables[i];
            table.values = this.rollMany(table.name).then((promise) => {
                output.push(promise.results);
            });
        }

        // Recurse through subfolders.
        for (let i = 0; i < folders.length; i++) {
            let folder = Object.assign({}, folders[i]);
            folder.values = this.fetchTables(folder);
            folder.name = folders[i].name;
            folder.folder = true;
            output.push(folder);
        }

        return output;

    }

    rollMany(rollTableName) {
        const rollTable = game.tables.entities.find(b => b.name === rollTableName);
        if (rollTable.data.results.length > 0) {
            let promise = rollTable.drawMany(this.numberToDraw, {displayChat: false});
            return promise;
        }
    }

}

// Add a button to the scene controls for quick access. Using @errational's hack to avoid adding a layer. May break at some point.
Hooks.on("renderSceneControls", async (app, html, data) => {
    const tableNinjaButtonHtml = await renderTemplate(`modules/table-ninja/templates/button.hbs`);
    html.append(tableNinjaButtonHtml);
    const tableNinjaButton = html.find("li[data-control='table-ninja']");
    tableNinjaButton.on("click", event => ui.tableNinja.toggleOpen());
});

Hooks.once('ready', async function() {
    if (ui.tableNinja === undefined) {
        ui.tableNinja = new TableNinja();
    }
});

async function preloadHandlebarsTemplates() {
    return loadTemplates(Object.values(TEMPLATE_PATHS));
};

Hooks.once("init", function () {
    preloadHandlebarsTemplates();
});