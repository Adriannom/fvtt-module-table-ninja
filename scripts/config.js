export const TEMPLATE_PATHS = {
    main: "modules/table-ninja/templates/main.hbs",
    group: "modules/table-ninja/templates/partials/group.hbs"
}
    
async function preloadHandlebarsTemplates() {
    return loadTemplates(Object.values(TEMPLATE_PATHS));
};

Hooks.once("init", function () {
    preloadHandlebarsTemplates();
});