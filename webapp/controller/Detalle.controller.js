sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/m/Link",
    "sap/m/MessageItem",
    "sap/m/MessageView",
    "sap/ui/core/message/Message",
    "sap/m/MessagePopover",
    "sap/ui/core/Icon",
    "sap/ui/core/library",
    "sap/ui/core/Messaging",
    "sap/ui/core/message/MessageType"
], function (
    Controller,
    JSONModel,
    Filter,
    FilterOperator,
    Fragment,
    MessageToast,
    MessageBox,
    Link,
    MessageItem,
    MessageView,
    Message,
    MessagePopover,
    Icon,
    library,
    Messaging,
    MessageType
) {
    "use strict";

    return Controller.extend("pluspe.z9451controlhes.controller.Detalle", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Detalle").attachPatternMatched(this._onRouteMatched, this);

            var oGlobalModel = this.getOwnerComponent().getModel("globalModel");
            if (oGlobalModel) {
                var oGlobalData = oGlobalModel.getData();
                console.log("Modelo global recibido:", oGlobalData);
            } else {
                console.error("No se encontró el modelo global");
            }

        },

        _onRouteMatched: function (oEvent) {
            const sOrden = oEvent.getParameter("arguments").orden;
            const sOrdenPosicion = oEvent.getParameter("arguments").ordenPosicion;
            const sCatAsig = oEvent.getParameter("arguments").catAsig;

            const oModel = new JSONModel({
                orden: sOrden,
                ordenPosicion: sOrdenPosicion,
                catAsig: sCatAsig
            });
            this.getView().setModel(oModel, "detalleModel");

            this._loadOrderItems(sOrden, sOrdenPosicion, sCatAsig);
        },

        _loadOrderItems: function (sOrden, sOrdenPosicion, sCatAsig) {
            const oModel = this.getOwnerComponent().getModel();
            const aFilters = [
                new Filter("Orden", FilterOperator.EQ, sOrden),
                new Filter("OrdenPosicion", FilterOperator.EQ, sOrdenPosicion)
            ];


            const bMostrarAccion = sCatAsig === "U";
            this.getView().getModel("detalleModel").setProperty("/mostrarAccion", bMostrarAccion);

            oModel.read("/InDetallePedidoSet", {
                filters: aFilters,
                success: function (oData) {
                    oData.results.forEach(function (item) {
                        item.Totalizar = item.Totalizar === "true" || item.Totalizar === true;
                        item.MostrarInputs = bMostrarAccion;
                    });

                    const oItemsModel = new JSONModel({ items: oData.results });
                    this.getView().setModel(oItemsModel, "itemsModel");
                }.bind(this),
                error: function (oError) {
                    console.error("Error al obtener los ítems de la orden", oError);
                }
            });
        },
        onAccionDetallePress: function (oEvent) {
            var oButton = oEvent.getSource();
            var oContext = oButton.getBindingContext("itemsModel");

            if (oContext) {
                var sPath = oContext.getPath();
                var oModel = oContext.getModel();
                var oOriginalData = oModel.getProperty(sPath);

                var oClonedData = JSON.parse(JSON.stringify(oOriginalData));

                oClonedData.CantPorc = oOriginalData.CantPorc;
                oClonedData.CentroBeneficio = "";
                oClonedData.Contrato = oOriginalData.Contrato;
                oClonedData.Linea = "";
                oClonedData.NumeroPack = "";
                oClonedData.Orden = oOriginalData.Orden;
                oClonedData.OrdenPosicion = "";
                oClonedData.Servicio = "";
                oClonedData.Usado = "";
                oClonedData.Valor = "";
                oClonedData.Saldo = "";
                oClonedData.ImporteNuevo = oOriginalData.ImporteNuevo || "";


                oClonedData.Proyectos = "";
                oClonedData.DescripcionProyecto = "";

                oClonedData.EsClon = true;
                oClonedData.MostrarInputs = true;
                oClonedData.EsOriginal = false;

                oClonedData.ClaseInput = "inputBelowText sapUiLargeMarginTop";
                oClonedData.MostrarCheck = false;

                var aItems = oModel.getProperty("/items");
                var iIndex = parseInt(sPath.split("/").pop(), 10);

                aItems.splice(iIndex + 1, 0, oClonedData);
                oModel.setProperty("/items", aItems);
                oModel.refresh(true);
            }
        }

        ,

        onAccionDetallePPress2: function () {
            var oModel = this.getView().getModel("itemsModel");
            var aData = oModel.getProperty("/items");


            var iLastClonIndex = -1;
            for (var i = aData.length - 1; i >= 0; i--) {
                if (aData[i].EsClon === true) {
                    iLastClonIndex = i;
                    break;
                }
            }

            if (iLastClonIndex === -1) {
                sap.m.MessageToast.show("No hay clones para eliminar.");
                return;
            }


            aData.splice(iLastClonIndex, 1);


            oModel.setProperty("/items", aData);
            this.byId("idDetalleTable").getBinding("items").refresh(true);
        },

        onValueHelpProyecto: function (oEvent) {
            var oView = this.getView();
            var oModel = this.getOwnerComponent().getModel();


            this._currentRowContext = oEvent.getSource().getBindingContext("itemsModel");

            oModel.read("/ProyectosSet", {
                success: function (oData) {
                    var oProyectosModel = new sap.ui.model.json.JSONModel({
                        proyectos: oData.results
                    });
                    oView.setModel(oProyectosModel, "proyectosModel");

                    if (!this._oProyectoDialog) {
                        sap.ui.core.Fragment.load({
                            name: "pluspe.z9451controlhes.fragments.Proyectos",
                            id: oView.getId(),
                            controller: this
                        }).then(function (oDialog) {
                            this._oProyectoDialog = oDialog;
                            oView.addDependent(oDialog);
                            this._oProyectoDialog.open();
                        }.bind(this));
                    } else {
                        this._oProyectoDialog.open();
                    }
                }.bind(this),
                error: function (oError) {
                    sap.m.MessageToast.show("Error al cargar los proyectos");
                    console.error("OData error al leer /ProyectosSet", oError);
                }
            });
        },
        onConfirmarProyecto: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");
            if (!oSelectedItem) return;

            var oContext = this._currentRowContext;

            if (oContext) {
                var sPath = oContext.getPath();
                var oModel = this.getView().getModel("itemsModel");

                var sId = oSelectedItem.getTitle();
                var sDescripcion = oSelectedItem.getDescription();

                oModel.setProperty(sPath + "/Proyectos", sId);
                oModel.setProperty(sPath + "/DescripcionProyecto", sDescripcion);
            }
        }




        ,

        onValueHelpCuentaMayor: function (oEvent) {
            const oInput = oEvent.getSource();
            this._oCuentaMayorContext = oInput.getBindingContext("itemsModel");

            const oView = this.getView();
            const oModel = this.getOwnerComponent().getModel();

            oModel.read("/VHCuentaMayorSet", {
                success: function (oData) {
                    const oCuentaMayorModel = new JSONModel({ cuentas: oData.results });
                    oView.setModel(oCuentaMayorModel, "CuentaMayorModel");

                    if (!this._oCuentaMayorDialog) {
                        Fragment.load({
                            name: "pluspe.z9451controlhes.fragments.CuentaMayorValueHelp",
                            id: oView.getId(),
                            controller: this
                        }).then(function (oDialog) {
                            this._oCuentaMayorDialog = oDialog;
                            oView.addDependent(oDialog);
                            oDialog.open();
                        }.bind(this));
                    } else {
                        this._oCuentaMayorDialog.open();
                    }
                }.bind(this),
                error: function () {
                    MessageToast.show("Error al cargar Cuentas Mayores.");
                }
            });
        },

        onSearchCuentaMayor: function (oEvent) {
            const sValue = oEvent.getParameter("value");
            let oFilter = null;

            if (sValue) {
                oFilter = new Filter({
                    filters: [
                        new Filter("NumCuenta", FilterOperator.Contains, sValue),
                        new Filter("Descripcion", FilterOperator.Contains, sValue)
                    ],
                    and: false
                });
            }

            const oBinding = oEvent.getSource().getBinding("items");
            oBinding.filter(oFilter);
        },

        onCuentaMayorSeleccionada: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem) {
                const oData = oSelectedItem.getBindingContext("CuentaMayorModel").getObject();
                const sNumCuenta = oData.NumCuenta;

                const oRowContext = this._oCuentaMayorContext;
                if (oRowContext) {
                    const oContratoModel = this.getView().getModel("itemsModel");
                    oContratoModel.setProperty(oRowContext.getPath() + "/CuentaMayor", sNumCuenta);
                    this.onCuentaMayorChange({
                        getSource: () => {
                            const oTable = this.byId("idDetalleTable");
                            const aItems = oTable.getItems();
                            for (let i = 0; i < aItems.length; i++) {
                                const oCtx = aItems[i].getBindingContext("itemsModel");
                                if (oCtx === oRowContext) {
                                    return aItems[i].getCells()[1].getItems()[1];
                                }
                            }
                            return null;
                        }
                    });
                }
            }
        },

        onValueHelpTipoImputacion: function (oEvent) {
            const oInput = oEvent.getSource();
            this._oTipoImputacionContext = oInput.getBindingContext("itemsModel");

            const oView = this.getView();
            const oModel = this.getOwnerComponent().getModel();

            oModel.read("/VHTipoImputacionSet", {
                success: function (oData) {
                    const oTipoImpModel = new JSONModel({ tipos: oData.results });
                    oView.setModel(oTipoImpModel, "TipoImputacionModel");

                    if (!this._oTipoImpDialog) {
                        Fragment.load({
                            name: "pluspe.z9451controlhes.fragments.TipoImputacionValueHelp",
                            id: oView.getId(),
                            controller: this
                        }).then(function (oDialog) {
                            this._oTipoImpDialog = oDialog;
                            oView.addDependent(oDialog);
                            oDialog.open();
                        }.bind(this));
                    } else {
                        this._oTipoImpDialog.open();
                    }
                }.bind(this),
                error: function () {
                    MessageToast.show("Error al cargar tipos de imputación.");
                }
            });
        },

        onTipoImputacionSeleccionado: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem && this._oTipoImputacionContext) {
                const oData = oSelectedItem.getBindingContext("TipoImputacionModel").getObject();
                const sTipoImputacion = oData.TipoImputacion;

                const oContratoModel = this.getView().getModel("itemsModel");
                oContratoModel.setProperty(this._oTipoImputacionContext.getPath() + "/TipoImputacion", sTipoImputacion);
            }
        },

        onSearchTipoImputacion: function (oEvent) {
            const sQuery = oEvent.getParameter("value");
            const oBinding = oEvent.getSource().getBinding("items");

            const oFilter = new Filter({
                filters: [
                    new Filter("TipoImputacion", FilterOperator.Contains, sQuery),
                    new Filter("Descripcion", FilterOperator.Contains, sQuery)
                ],
                and: false
            });

            oBinding.filter([oFilter]);
        },

        onValueHelpDistribucion: function (oEvent) {
            const oInput = oEvent.getSource();
            this._oIndDistribucionContext = oInput.getBindingContext("itemsModel");

            const oView = this.getView();
            const oModel = this.getOwnerComponent().getModel();

            oModel.read("/VHIndicadorDistribucionSet", {
                success: function (oData) {
                    const oDistribModel = new JSONModel({ indicadores: oData.results });
                    oView.setModel(oDistribModel, "IndDistribucionModel");

                    if (!this._oIndDistribDialog) {
                        Fragment.load({
                            name: "pluspe.z9451controlhes.fragments.IndDistribucionValueHelp",
                            id: oView.getId(),
                            controller: this
                        }).then(function (oDialog) {
                            this._oIndDistribDialog = oDialog;
                            oView.addDependent(oDialog);
                            oDialog.open();
                        }.bind(this));
                    } else {
                        this._oIndDistribDialog.open();
                    }
                }.bind(this),
                error: function () {
                    MessageToast.show("Error al cargar indicadores.");
                }
            });
        },

        onIndDistribucionSeleccionado: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem && this._oIndDistribucionContext) {
                const oData = oSelectedItem.getBindingContext("IndDistribucionModel").getObject();
                const sIndDistribucion = oData.IndicadorDis;

                const oContratoModel = this.getView().getModel("itemsModel");
                oContratoModel.setProperty(this._oIndDistribucionContext.getPath() + "/IndDistribucion", sIndDistribucion);
                oContratoModel.refresh(true);
            }
        },
        _habilitarInputOrdenSegunCentro: function (oRow) {

            var oInputOrden = oRow.getCells().find(function (oCell) {
                if (oCell instanceof sap.m.Input && oCell.getId().includes("Orden")) {
                    return true;
                }
                if (oCell instanceof sap.m.VBox) {
                    return oCell.getItems().some(function (oItem) {
                        return (oItem instanceof sap.m.Input) && oItem.getId().includes("Orden");
                    });
                }
                return false;
            });

            if (oInputOrden instanceof sap.m.VBox) {
                oInputOrden = oInputOrden.getItems().find(function (oItem) {
                    return (oItem instanceof sap.m.Input) && oItem.getId().includes("Orden");
                });
            }

            if (!oInputOrden) return;

            var oInputCentro = oRow.getCells().find(function (oCell) {
                if (oCell instanceof sap.m.VBox) {
                    return oCell.getItems().some(function (oItem) {
                        return (oItem instanceof sap.m.Input) && oItem.getId().includes("CentroCoste");
                    });
                }
                return false;
            });

            if (oInputCentro instanceof sap.m.VBox) {
                oInputCentro = oInputCentro.getItems().find(function (oItem) {
                    return (oItem instanceof sap.m.Input) && oItem.getId().includes("CentroCoste");
                });
            }

            if (!oInputCentro) return;

            if (oInputCentro.getValue().trim() !== "") {
                oInputOrden.setValue("");
                oInputOrden.setEnabled(false);
                oInputOrden.addStyleClass("inputDisabledCustom");
            } else {
                oInputOrden.setEnabled(true);
                oInputOrden.removeStyleClass("inputDisabledCustom");
            }
        },

        onValueHelpCentroCoste: function (oEvent) {
            const oView = this.getView();
            const oModel = this.getOwnerComponent().getModel();
            this._oCentroCosteContext = oEvent.getSource().getBindingContext("itemsModel");

            oModel.read("/VHCentrodeCosteSet", {
                success: function (oData) {
                    const oCentroCosteModel = new JSONModel({ centros: oData.results });
                    oView.setModel(oCentroCosteModel, "centroCosteModel");

                    if (!this._oCentroCosteDialog) {
                        Fragment.load({
                            name: "pluspe.z9451controlhes.fragments.CentroCosteValueHelp",
                            id: oView.getId(),
                            controller: this
                        }).then(function (oDialog) {
                            this._oCentroCosteDialog = oDialog;
                            oView.addDependent(oDialog);
                            oDialog.open();
                        }.bind(this));
                    } else {
                        this._oCentroCosteDialog.open();
                    }
                }.bind(this),
                error: function (oError) {
                    MessageToast.show("Error al cargar centros de coste");
                    console.error("Error al leer VHCentrosCoste", oError);
                }
            });
        },

        onCentroCosteSeleccionado: function (oEvent) {
            const oSelectedItem = oEvent.getParameter("selectedItem");
            if (oSelectedItem && this._oCentroCosteContext) {
                const oData = oSelectedItem.getBindingContext("centroCosteModel").getObject();
                const sCentro = oData.Centro;

                const oModel = this.getView().getModel("itemsModel");
                oModel.setProperty(this._oCentroCosteContext.getPath() + "/CentroCoste", sCentro);


                const oTable = this.byId("idDetalleTable");
                const aItems = oTable.getItems();

                for (let i = 0; i < aItems.length; i++) {
                    const oCtx = aItems[i].getBindingContext("itemsModel");
                    if (oCtx && oCtx.getPath() === this._oCentroCosteContext.getPath()) {
                        this._habilitarInputOrdenSegunCentro(aItems[i]);
                        break;
                    }
                }

                this._oCentroCosteContext = null;


                this._oCentroCosteDialog.close();
            }
        },

        onCentroCosteChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sPath = oInput.getBindingContext("itemsModel").getPath();
            const oModel = this.getView().getModel("itemsModel");
            const oData = oModel.getProperty(sPath);

            const tieneCentroCoste = !!oData.CentroCoste;

            oModel.setProperty(sPath + "/OrdenEnabled", !tieneCentroCoste);
        },

        onOrdenChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sPath = oInput.getBindingContext("itemsModel").getPath();
            const oModel = this.getView().getModel("itemsModel");
            const oData = oModel.getProperty(sPath);

            const tieneOrden = !!oData.OrdenInput;

            oModel.setProperty(sPath + "/CentroCosteEnabled", !tieneOrden);
        },


        onCheckboxSelect: function (oEvent) {
            var oListItem = oEvent.getSource().getParent();
            var oInput = oListItem.getCells()[10];
            var bSelected = oEvent.getParameter("selected");
            oInput.setEnabled(!bSelected);
        },

        onCloseDialog: function () {
            this.byId("myDialog").close();
        },

        onShowMessages: function (aMensajes) {
            var oView = this.getView();

            var oModel = new sap.ui.model.json.JSONModel({
                messages: aMensajes
            });

            if (!this._pDialog) {
                this._pDialog = sap.ui.core.Fragment.load({
                    id: oView.getId(),
                    name: "pluspe.z9451controlhes.view.MessageDialog",
                    controller: this
                }).then(function (oDialog) {
                    oView.addDependent(oDialog);
                    oDialog.setModel(oModel);
                    oDialog.open();
                    return oDialog;
                });
            } else {
                this._pDialog.then(function (oDialog) {
                    oDialog.setModel(oModel);
                    oDialog.open();
                });
            }
        },

        onCloseDialog: function () {
            this.byId("messageDialog").close();


        },

        onGuardarCM: function () {

            var oView = this.getView();
            var sCuentaMayor = oView.byId("inputCuentaMayor").getValue().trim();
            var sCentroBeneficio = oView.byId("inputCentroBeneficio").getValue().trim();
            var sPorcentaje = oView.byId("inputPorcentaje").getValue().trim();
            var sValorNeto = oView.byId("inputValorNeto").getValue().trim();
            var sIndicador = oView.byId("inputIndiDis").getValue().trim();
            var sTipoImputacion = oView.byId("inputtipoimputacion").getValue().trim();

            if (!sCuentaMayor || !sCentroBeneficio || !sPorcentaje || !sValorNeto) {
                MessageToast.show("Todos los campos son obligatorios.");
                return;
            }

            var oDatosFragmento = {
                CuentaMayor: sCuentaMayor,
                CentroBeneficio: sCentroBeneficio,
                Porcentaje: sPorcentaje,
                ValorNeto: sValorNeto,
                Indicador: sIndicador,
                TipoImputacion: sTipoImputacion
            };

            var oModel = new JSONModel(oDatosFragmento);
            this.getView().setModel(oModel, "fragmentData");

            this.byId("myDialog").close();
        },

        onContinuePress: function () {
            const toYYYYMMDD = function (date) {
                if (!(date instanceof Date)) return "";
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}${month}${day}`;
            };

            var oView = this.getView();
            var oGlobalModel = this.getOwnerComponent().getModel("globalModel");

            if (!oGlobalModel) {
                sap.m.MessageBox.error("No se encontró el modelo global.");
                return;
            }

            var oGlobalData = oGlobalModel.getData();
            var oTable = oView.byId("idDetalleTable");
            var aItems = oTable.getItems();
            var aDeepEntityItems = [];

            aItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("itemsModel");
                if (!oContext) return;

                var oData = oContext.getObject();
                if (!oData) return;

                var bSelected = oData.Totalizar === "X";
                var sInputValue = oData.ImporteNuevo?.toString().trim() || "";


                if (bSelected || sInputValue !== "") {
                    var oEntry = {
                        Orden: oData.Orden,
                        OrdenPosicion: oData.OrdenPosicion,
                        Linea: oData.Linea,
                        Servicio: oData.Servicio,
                        Valor: oData.Valor,
                        Usado: oData.Usado,
                        Saldo: oData.Saldo,
                        Contrato: oData.Contrato,
                        NumeroPack: oData.NumeroPack,
                        Totalizar: bSelected ? "X" : "",
                        ImporteNuevo: sInputValue,
                        Usuario: oGlobalData.Usuario,
                        Ubicacion: oGlobalData.Ubicacion,
                        TextoBreve: oGlobalData.TextoBreve,
                        PeriodoDesde: toYYYYMMDD(oGlobalData.PeriodoDesde),
                        PeriodoHasta: toYYYYMMDD(oGlobalData.PeriodoHasta),
                        CuentaMayor: oData.CuentaMayor || "",
                        CentroCosteIn: oData.CentroCoste || "",
                        OrdenInput: oData.OrdenInput || "",
                        CantPorc: oData.CantPorc || "",
                        TipoImputacion: oData.TipoImputacion || "",
                        IndDistribucionIn: oData.IndDistribucion || "",
                        Proyectos: oData.Proyectos || "",

                    };

                    aDeepEntityItems.push(oEntry);
                }
            });

            if (aDeepEntityItems.length === 0) {
                sap.m.MessageToast.show("No hay datos modificados para enviar.");
                return;
            }

            var oCombinedData = {
                Key: "x",
                HeaderToDetailNav: aDeepEntityItems
            };


            var oODataModel = this.getOwnerComponent().getModel();


            oView.setBusy(true);

            var oODataModel = this.getOwnerComponent().getModel();
            oODataModel.create("/HeaderSet", oCombinedData, {
                success: function (oData) {
                    console.log("✔️ Llamada OData exitosa:", oData);
                    oView.setBusy(false);

                    var aResultados = oData?.HeaderToDetailNav?.results || [];


                    // Construir array de mensajes
                    var aMensajes = aResultados.map(function (item) {
                        var sType;

                        switch (item.TipoMensaje) {
                            case "E": sType = "Error"; break;
                            case "S": sType = "Success"; break;
                            case "W": sType = "Warning"; break;
                            case "I": sType = "Information"; break;
                            default: sType = "None"; break;
                        }

                        return {
                            title: item.Mensaje,
                            type: sType
                        };
                    });
                    // Si no hay mensajes, no mostrar nada
                    if (aMensajes.length === 0) {
                        return;
                    }

                    // Crear modelo de mensajes
                    var oMessageModel = new sap.ui.model.json.JSONModel({ messages: aMensajes });

                    // Setear el modelo en la vista
                    oView.setModel(oMessageModel, "messageModel");

                    // Mostrar el fragmento
                    if (!this._oMessageDialog) {
                        Fragment.load({
                            name: "pluspe.z9451controlhes.view.MessageDialog", // ajustá si el path es otro
                            controller: this
                        }).then(function (oDialog) {
                            this._oMessageDialog = oDialog;
                            oView.addDependent(oDialog);
                            oDialog.setModel(oMessageModel, "messageModel");
                            oDialog.open();
                        }.bind(this));
                    } else {
                        this._oMessageDialog.setModel(oMessageModel, "messageModel");
                        this._oMessageDialog.open();
                    }

                }.bind(this), // ¡¡IMPORTANTE!!

                error: function () {
                    this.getView().setBusy(false);
                    sap.m.MessageBox.error("Error al enviar los datos");
                }.bind(this) // también importante
            });

        },
          onCloseDialog: function () {
      if (this._oMessageDialog) {
        this._oMessageDialog.close();
      }
    }



    });
});
