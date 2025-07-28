sap.ui.define([
    "sap/ui/core/UIComponent",
    "pluspe/z9451controlhes/model/models"
], (UIComponent, models) => {
    "use strict";

    return UIComponent.extend("pluspe.z9451controlhes.Component", {
        metadata: {
            manifest: "json",
            interfaces: [
                "sap.ui.core.IAsyncContentCreation"
            ]
        },

        init() {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);


                        // Cargar tu CSS
            sap.ui.getCore().loadLibrary("sap.ui.core");
           jQuery.sap.includeStyleSheet(jQuery.sap.getModulePath("pluspe.z9451controlhes") + "/css/style.css");

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            // enable routing
            this.getRouter().initialize();
        }
    });
});