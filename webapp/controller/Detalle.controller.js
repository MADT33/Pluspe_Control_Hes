sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], function (Controller, JSONModel, Filter, FilterOperator, Fragment, MessageToast, MessageBox) {
    "use strict";

    return Controller.extend("pluspe.z9451controlhes.controller.Detalle", {

        onInit: function () {
            const oRouter = this.getOwnerComponent().getRouter();
            oRouter.getRoute("Detalle").attachPatternMatched(this._onRouteMatched, this);

            const oFormDataModel = this.getOwnerComponent().getModel("formData");
            if (oFormDataModel) {
                this.getView().setModel(oFormDataModel, "formData");
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

            oModel.read("/InDetallePedidoSet", {
                filters: aFilters,
                success: function (oData) {
                    oData.results.forEach(function (item) {
                        item.Totalizar = item.Totalizar === "true" || item.Totalizar === true;
                        item.MostrarInputs = (sCatAsig === "U");
                    });

                    const oItemsModel = new JSONModel({ items: oData.results });
                    this.getView().setModel(oItemsModel, "itemsModel");
                }.bind(this),
                error: function (oError) {
                    console.error("Error al obtener los ítems de la orden", oError);
                }
            });
        },

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
            // Buscar el input Orden dentro de la misma fila
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

                // Accedo al item de la tabla para deshabilitar input Orden si corresponde
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

                // Cerramos el dialog
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


        onImporteNuevoChange: function (oEvent) {

            var oModelCast = this.getView().getModel("detalleModel").getData();

            if (oModelCast.catAsig === "U") {

                var bMostrar = !!sValor;
                oModel.setProperty(sPath + "/MostrarInputs", bMostrar);
            } else {
                oModel.setProperty(sPath + "/MostrarInputs", false); // Asegura que no se muestre si no es 'U'
            }
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
            var oModelUsuarios = this.getOwnerComponent().getModel("formData").getData();
            //var ModelFragment = this.getView().getModel("fragmentData").getData();
            var oTable = oView.byId("idDetalleTable");
            var aItems = oTable.getItems();
            var aDeepEntityItems = [];






            aItems.forEach(function (oItem) {
                var oContext = oItem.getBindingContext("itemsModel");
                var oData = oContext.getObject();
                var aCells = oItem.getCells();
                var oCheckBox = aCells.find(cell => cell instanceof sap.m.CheckBox);
                var oInput = aCells.find(cell => cell instanceof sap.m.Input);

                if (!oCheckBox || !oInput) {
                    console.warn("No se encontraron el checkbox o el input en la fila.");
                    return;
                }


                // Leer valores de las celdas 0 a 5 (Inputs visibles)
                var cuentaMayor = oItem.getCells()[3].mAggregations.items[1].mProperties.value;
                var centroCoste = oItem.getCells()[4].mAggregations.items[1].mProperties.value;
                var ordenInput = oItem.getCells()[5].mAggregations.items[1].mProperties.value;
                var cantPorc = oItem.getCells()[6].mAggregations.items[1].mProperties.value;
                var tipoImputacion = oItem.getCells()[7].mAggregations.items[1].mProperties.value;
                var indDistribucion = oItem.getCells()[8].mAggregations.items[1].mProperties.value;


                var bSelected = oCheckBox.getSelected();
                var sInputValue = oInput.getValue().trim();

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
                        Usuario: oModelUsuarios.Usuario,
                        Ubicacion: oModelUsuarios.Ubicacion,
                        TextoBreve: oModelUsuarios.TextoBreve,
                        PeriodoDesde: toYYYYMMDD(oModelUsuarios.PeriodoDesde),
                        PeriodoHasta: toYYYYMMDD(oModelUsuarios.PeriodoHasta),
                        CuentaMayor: cuentaMayor,
                        CentroCosteIn: centroCoste,
                        OrdenInput: ordenInput,
                        CantPorc: cantPorc,
                        TipoImputacion: tipoImputacion,
                        IndDistribucionIn: indDistribucion
                    };

                    aDeepEntityItems.push(oEntry);
                }
            });

            if (aDeepEntityItems.length === 0) {
                MessageToast.show("No hay datos modificados para enviar.");
                return;
            }

            var oCombinedData = {
                Key: "x",
                HeaderToDetailNav: aDeepEntityItems
            };

            var oODataModel = this.getOwnerComponent().getModel();
            oODataModel.create("/HeaderSet", oCombinedData, {
                success: function () {
                    MessageToast.show("Datos guardados correctamente.");
                },
                error: function (oError) {
                    console.error("Error al guardar los datos", oError);
                    MessageToast.show("Error al guardar los datos.");
                }
            });
        }
    });
});
