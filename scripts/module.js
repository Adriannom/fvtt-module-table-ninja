class TableNinja extends Application {

    template = "modules/table-ninja/templates/main.hbs";
    
    static get defaultOptions() {
        const options = super.defaultOptions
        options.width = 200;
        options.height= 200;
        options.resizable = true;
        return options;
    }

    getData() {
        return this.data;
    }

    constructor(options = {}) {
        super(options);
        this.refresh();
    }

    toggleOpen() {
        if (game.user.isGM) {
            if (this.rendered) {
                this.close();
            } else {
                this.render(true);
            }
        }
    }

    refresh() {
        
        this.data = [];

        // Retrieve everything from the table folder "Table Ninja".
        const tableNinjaFolder = game.folders.filter(x => x.data.type == "RollTable").find(b => b.name === "Table Ninja");
        const tables = tableNinjaFolder.content;
        const folders = tableNinjaFolder.children;

        // Roll many times on each table.
        for (let i = 0; i < tables.length; i++) {
            let table = tables[i];
            table.values = this.rollMany(table.name).then((p) => {
                this.data.push(p.results);
            });
        }

        // First level of folders will be turned into tabs. Second level will be groups of results.
        for (let i = 0; i < folders.length; i++) {
            let folder = Object.assign({}, folders[i]);
            folder.content = folders[i].content;
            folder.name = folders[i].name;
            folder.folder = true;
            this.data.push(folder);
        }

        this.render();

    }

    rollMany(rollTableName) {
        const rollTable = game.tables.entities.find(b => b.name === rollTableName);
        if (rollTable.data.results.length > 0) {
            let promise = rollTable.drawMany(30, {displayChat: false});
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
