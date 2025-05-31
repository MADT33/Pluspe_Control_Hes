sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  "sap/ui/core/Fragment",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], (Controller, JSONModel, Filter, FilterOperator, Fragment, MessageToast, MessageBox) => {
  "use strict";

  return Controller.extend("pluspe.z9451controlhes.controller.View1", {
    onInit: function () {
      // Crear el modelo JSON vacío y asignarlo a la vista
      var oOrdenModel = new JSONModel({
        Ordenes: [],
        Contrato: "Sin Contrato"
      });
      this.getView().setModel(oOrdenModel, "OrdenModel");

      var oContratoModel = new sap.ui.model.json.JSONModel({ ContratoDetalle: [] });
      this.getView().setModel(oContratoModel, "contratoModel");

    },

    _validateInput: function (oInput) {
      var sValueState = "None";
      var bValidationError = false;
      var oBinding = oInput.getBinding("value");

      try {
        oBinding.getType().validateValue(oInput.getValue());
      } catch (oException) {
        sValueState = "Error";
        bValidationError = true;
      }

      oInput.setValueState(sValueState);

      return bValidationError;
    },

    onNameChange: function (oEvent) {
      var oInput = oEvent.getSource();
      this._validateInput(oInput);
    },
    onItemPress: function (oEvent) {

      // Obtener el item presionado (list item)
      var oItem = oEvent.getParameter("listItem") || oEvent.getSource();

      // Obtener el contexto del modelo 'OrdenModel' del item
      var oContext = oItem.getBindingContext("OrdenModel");

      if (oContext) {
        // Obtener el valor de 'Orden' de la fila
        var sOrden = oContext.getProperty("Orden");
        var sOrdenPosicion = oContext.getProperty("OrdenPosicion");

        // Navegar a la vista Detalle con el parámetro 'orden'
        this.getOwnerComponent().getRouter().navTo("Detalle", {
          orden: sOrden,
          ordenPosicion: sOrdenPosicion,
          catAsig: oContext.getProperty("CatAsig")

        });
      }

    },
    onTogglePanel: function () {
      var oPanel = this.byId("myPanel");
      var oButton = this.byId("toggleButton");

      // Expandir o contraer el panel
      var bExpanded = oPanel.getExpanded();
      oPanel.setExpanded(!bExpanded);

      // Obtener el valor del contrato desde el modelo de la vista
      var oViewModel = this.getView().getModel("OrdenModel");
      var sContrato = oViewModel.getProperty("/Contrato");

      var oDataModel = this.getOwnerComponent().getModel();
      var that = this;

      // Verificar si el contrato tiene un valor válido
      if (!sContrato) {
        sap.m.MessageToast.show("Número de contrato no encontrado.");
        return;
      }

      // Crear el filtro con el número de contrato
      var aFilters = [
        new sap.ui.model.Filter("Contrato", sap.ui.model.FilterOperator.EQ, sContrato)
      ];

      // Llamada al OData con el filtro
      oDataModel.read("/InContratoDetSet", {
        filters: aFilters,
        success: function (oData) {
          if (oData && oData.results.length > 0) {
            // Actualizar el modelo con los datos obtenidos
            var oContratoModel = that.getView().getModel("contratoModel");
            oContratoModel.setProperty("/ContratoDetalle", oData.results);
            sap.m.MessageToast.show("Datos cargados correctamente.");
          } else {
            sap.m.MessageToast.show("No hay registros para el contrato seleccionado.");
          }
        },
        error: function () {
          sap.m.MessageToast.show("Error al consultar el contrato.");
        }
      });
    },
ContinuarProceso: function () {
  var oView = this.getView();
  var oTable = oView.byId("contratoTable");
  var aItems = oTable.getItems();
  var aDeepEntityItems = [];

  var Usuario = oView.byId("inputUsuario").getValue();
  var Ubicacion = oView.byId("inputUbicacion").getValue();
  var TextoBreve = oView.byId("inputTexto").getValue();
  var PeriodoDesde = oView.byId("inputDesde").getDateValue();
  var PeriodoHasta = oView.byId("inputHasta").getDateValue();
 // var sHeaderKey = oView.byId("inputHeaderKey")?.getValue() || "X";


  aItems.forEach(function (oItem) {
    var oContext = oItem.getBindingContext("contratoModel");
    var oData = oContext.getObject();
    var aCells = oItem.getCells();


  var sInputValue = oItem.getCells()[7].mAggregations.items[0].mProperties.value;

  // Saltar fila si ImporteNuevo está vacío o cero
  if (!sInputValue || sInputValue === "0") {
    return;
  }

     
    
    // Leer valores de las celdas 0 a 5 (Inputs visibles)
    var cuentaMayor = oItem.getCells()[0].mAggregations.items[1].mProperties.value;
    var centroCoste = oItem.getCells()[1].mAggregations.items[1].mProperties.value;
    var ordenInput = oItem.getCells()[2].mAggregations.items[1].mProperties.value;
    var cantPorc = oItem.getCells()[3].mAggregations.items[1].mProperties.value;
    var tipoImputacion = oItem.getCells()[4].mAggregations.items[1].mProperties.value;
    var indDistribucion = oItem.getCells()[5].mAggregations.items[1].mProperties.value;

    // Crear la entrada del deep entity
    var oEntry = {
      Contrato: oData.Contrato,
      Orden: oData.Orden,
      OrdenPosicion: oData.OrdenPosicion,
      DescripcionContrato: oData.DescripcionContrato,
      NroServicio: oData.NroServicio,
      Descripcion: oData.Descripcion,
      Cantidad: oData.Cantidad,
      Usado: oData.Usado,
      Restante: oData.Restante,
      ImporteNuevo: sInputValue,
      Usuario: Usuario,
      Ubicacion: Ubicacion,
      TextoBreve: TextoBreve,
      PeriodoDesde: PeriodoDesde ? PeriodoDesde.toISOString() : "",
      PeriodoHasta: PeriodoHasta ? PeriodoHasta.toISOString() : "",
      CuentaMayor: cuentaMayor,
      CentroCoste: centroCoste,
      OrdenInput: ordenInput,
      CantPorc: cantPorc,
      TipoImputacion: tipoImputacion,
      IndDistribucion: indDistribucion
    };

    aDeepEntityItems.push(oEntry);
  });

  // Enviar si hay datos válidos
  if (aDeepEntityItems.length > 0) {
    var oModel = this.getOwnerComponent().getModel();


    var oPayload = {
      Key: "X",
      HeaderToContratosNav: aDeepEntityItems
    };

    oModel.create("/HeaderSet", oPayload, {
      success: function () {
        sap.m.MessageToast.show("Datos enviados correctamente");
      },
      error: function () {
        sap.m.MessageBox.error("Error al enviar los datos");
      }
    });
  } else {
    sap.m.MessageBox.warning("No hay datos para enviar.");
  }
}


,








    onValueHelpUsuario: function () {
      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel();

      // Leer la entidad VHUsuarios del modelo OData
      oModel.read("/UsuariosSet", {
        success: function (oData) {
          // Crear un modelo JSON con los resultados
          var oUsuariosModel = new sap.ui.model.json.JSONModel({
            usuarios: oData.results
          });
          oView.setModel(oUsuariosModel, "usuariosModel");

          // Cargar el fragment si no está cargado
          if (!this._oUsuarioDialog) {
            sap.ui.core.Fragment.load({
              name: "pluspe.z9451controlhes.fragments.UsuarioValueHelp", // Ajustá según tu proyecto
              id: oView.getId(),
              controller: this
            }).then(function (oDialog) {
              this._oUsuarioDialog = oDialog;
              oView.addDependent(oDialog);
              this._oUsuarioDialog.open();
            }.bind(this));
          } else {
            this._oUsuarioDialog.open();
          }
        }.bind(this),
        error: function (oError) {
          sap.m.MessageToast.show("Error al cargar los usuarios");
          console.error("OData error al leer /VHUsuarios", oError);
        }
      });
    },
    onSearchUsuario: function (oEvent) {
      var sQuery = oEvent.getParameter("value");

      // Crear filtro por 'nombre' o 'id'
      var aFilters = [];
      if (sQuery) {
        aFilters.push(
          new sap.ui.model.Filter({
            filters: [
              new sap.ui.model.Filter("Nombre", sap.ui.model.FilterOperator.Contains, sQuery),
              new sap.ui.model.Filter("Descripcion", sap.ui.model.FilterOperator.Contains, sQuery)
            ],
            and: false
          })
        );
      }

      // Aplicar filtros al binding de items
      var oBinding = oEvent.getSource().getBinding("items");
      oBinding.filter(aFilters);
    },
    onUsuarioSeleccionado: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("selectedItem");
      if (oSelectedItem) {
        // Obtener el nombre desde el binding context del modelo usuariosModel
        var oContext = oSelectedItem.getBindingContext("usuariosModel");
        var sNombre = oContext.getProperty("Nombre");

        // Setear el valor en el input y en el modelo detalleModel
        this.byId("inputUsuario").setValue(sNombre);

      }


    },
    onCentroCosteChange: function (oContext) {
      if (!oContext) return;

      const oModel = this.getView().getModel("contratoModel");
      const sPath = oContext.getPath();
      const sValorCentro = oModel.getProperty(sPath + "/CentroCoste");

      // Si tiene centro de coste → desactivar Orden
      if (sValorCentro && sValorCentro.trim() !== "") {
        oModel.setProperty(sPath + "/Orden", "");
        oModel.setProperty(sPath + "/OrdenEnabled", false); // usá esto en el XML
      } else {
        oModel.setProperty(sPath + "/OrdenEnabled", true);
      }
    },
 onImputacionChange: function (oEvent) {
    const oInput = oEvent.getSource();
    const oContext = oInput.getBindingContext("contratoModel");

    if (oContext) {
        oContext.getModel().setProperty(`${oContext.getPath()}/_modificado`, true);
    }

    },
    onOrdenChange: function (oEvent) {
      var oInputOrden = oEvent.getSource();
      var oRow = oInputOrden.getParent().getParent(); // VBox -> ColumnListItem (fila)

      // Buscar el input CentroCoste dentro de la misma fila
      var oInputCentro = oRow.getCells().find(function (oCell) {
        if (oCell instanceof sap.m.Input && oCell.getId().includes("CentroCoste")) {
          return true;
        }
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

      if (oInputOrden.getValue().trim() !== "") {
        oInputCentro.setValue("");
        oInputCentro.setEnabled(false);
        oInputCentro.addStyleClass("inputDisabledCustom");
      } else {
        oInputCentro.setEnabled(true);
        oInputCentro.removeStyleClass("inputDisabledCustom");
      }
    }
    ,

    onInputChange: function (oEvent) {
      var oInput = oEvent.getSource(); // el input que disparó el evento
      var oTable = this.getView().byId("contratoTable");

      // Subir a la fila (Item) correspondiente
      var oItem = oInput.getParent().getParent(); // VBox → ColumnListItem
      var aCells = oItem.getCells();

      // Tomar la descripción de esa fila
      var oVBoxDescripcion = aCells[1]; // ajustar si cambia
      var oTextDescripcion = oVBoxDescripcion.getItems()[0];
      var sDescripcion = oTextDescripcion.getText().trim();

      var mostrarInputs = sDescripcion.endsWith("U");

      // Mostrar/ocultar los inputs ocultos solo en esta fila
      for (var i = 0; i <= 5; i++) {
        var oVBox = aCells[i];
        var oHiddenInput = oVBox.getItems()[1]; // Segundo item en el VBox
        if (oHiddenInput instanceof sap.m.Input) {
          oHiddenInput.setVisible(mostrarInputs);
        }
      }

      // Habilitar botón "Guardar" si el input tiene valor
      var bEnableGuardar = oInput.getValue().trim() !== "";
      this.getView().byId("toggleButton2").setEnabled(bEnableGuardar);
    },
    onValueHelpCentroCoste: function (oEvent) {
      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel();


      this._oCentroCosteContext = oEvent.getSource().getBindingContext("contratoModel");


      oModel.read("/VHCentrodeCosteSet", {
        success: function (oData) {
          var oCentroCosteModel = new sap.ui.model.json.JSONModel({
            centros: oData.results
          });
          oView.setModel(oCentroCosteModel, "centroCosteModel");

          if (!this._oCentroCosteDialog) {
            sap.ui.core.Fragment.load({
              name: "pluspe.z9451controlhes.fragments.CentroCosteValueHelp",
              id: oView.getId(),
              controller: this
            }).then(function (oDialog) {
              this._oCentroCosteDialog = oDialog;
              oView.addDependent(oDialog);
              this._oCentroCosteDialog.open();
            }.bind(this));
          } else {
            this._oCentroCosteDialog.open();
          }
        }.bind(this),
        error: function (oError) {
          sap.m.MessageToast.show("Error al cargar centros de coste");
          console.error("Error al leer VHCentrosCoste", oError);
        }
      });
    },
    onCentroCosteSeleccionado: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("selectedItem");
      if (oSelectedItem && this._oCentroCosteContext) {
        var oData = oSelectedItem.getBindingContext("centroCosteModel").getObject();
        var sCentro = oData.Centro;

        var oModel = this.getView().getModel("contratoModel");
        oModel.setProperty(this._oCentroCosteContext.getPath() + "/CentroCoste", sCentro);

        // Buscar la fila en la tabla para aplicar validación
        const oTable = this.byId("contratoTable");
        const aItems = oTable.getItems();
        for (let i = 0; i < aItems.length; i++) {
          const oCtx = aItems[i].getBindingContext("contratoModel");
          if (oCtx && oCtx.getPath() === this._oCentroCosteContext.getPath()) {
            this._habilitarInputOrdenSegunCentro(aItems[i]);
            break;
          }
        }

        this._oCentroCosteContext = null;
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
    onValueHelpCuentaMayor: function (oEvent) {

      const oInput = oEvent.getSource();
      const oRowContext = oInput.getBindingContext("contratoModel");
      this._oCuentaMayorContext = oRowContext;


      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel(); // Modelo OData

      oModel.read("/VHCuentaMayorSet", {
        success: function (oData) {
          var oCuentaMayorModel = new sap.ui.model.json.JSONModel({
            cuentas: oData.results
          });
          oView.setModel(oCuentaMayorModel, "CuentaMayorModel");

          if (!this._oCuentaMayorDialog) {
            sap.ui.core.Fragment.load({
              name: "pluspe.z9451controlhes.fragments.CuentaMayorValueHelp",
              id: oView.getId(),
              controller: this
            }).then(function (oDialog) {
              this._oCuentaMayorDialog = oDialog;
              oView.addDependent(oDialog);
              this._oCuentaMayorDialog.open();
            }.bind(this));
          } else {
            this._oCuentaMayorDialog.open();
          }
        }.bind(this),
        error: function () {
          sap.m.MessageToast.show("Error al cargar Cuentas Mayores.");
        }
      });
    },
    onSearchCuentaMayor: function (oEvent) {
      var sValue = oEvent.getParameter("value");
      var oFilter = null;

      if (sValue && sValue.length > 0) {
        // Filtrar por NumCuenta o Descripcion
        oFilter = new sap.ui.model.Filter({
          filters: [
            new sap.ui.model.Filter("NumCuenta", sap.ui.model.FilterOperator.Contains, sValue),
            new sap.ui.model.Filter("Descripcion", sap.ui.model.FilterOperator.Contains, sValue)
          ],
          and: false
        });
      }

      var oBinding = oEvent.getSource().getBinding("items");
      oBinding.filter(oFilter);
    },
    onCuentaMayorSeleccionada: function (oEvent) {
      const oSelectedItem = oEvent.getParameter("selectedItem");
      if (oSelectedItem) {
        const oContext = oSelectedItem.getBindingContext("CuentaMayorModel");

        if (oContext) {
          const oData = oContext.getObject();
          const sNumCuenta = oData.NumCuenta;

          // Usar el contexto de fila guardado
          const oRowContext = this._oCuentaMayorContext;
          if (oRowContext) {
            const oContratoModel = this.getView().getModel("contratoModel");
            oContratoModel.setProperty(oRowContext.getPath() + "/CuentaMayor", sNumCuenta);

            // Validación cruzada si aplica
            this.onCuentaMayorChange({
              getSource: () => {
                const oTable = this.byId("contratoTable");
                const aItems = oTable.getItems();
                for (let i = 0; i < aItems.length; i++) {
                  const oCtx = aItems[i].getBindingContext("contratoModel");
                  if (oCtx === oRowContext) {
                    const oVBox = aItems[i].getCells()[1]; // columna donde está el VBox
                    return oVBox.getItems()[1]; // input de Cuenta Mayor
                  }
                }
                return null;
              }
            });
          }
        }
      }
    }
    ,
    onValueHelpTipoImputacion: function (oEvent) {

      const oInput = oEvent.getSource();
      const oRowContext = oInput.getBindingContext("contratoModel");
      this._oTipoImputacionContext = oRowContext;  // <- cambio aquí



      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel(); // ODataModel

      oModel.read("/VHTipoImputacionSet", {
        success: function (oData) {
          var oTipoImpModel = new sap.ui.model.json.JSONModel({
            tipos: oData.results
          });
          oView.setModel(oTipoImpModel, "TipoImputacionModel");

          if (!this._oTipoImpDialog) {
            sap.ui.core.Fragment.load({
              name: "pluspe.z9451controlhes.fragments.TipoImputacionValueHelp",
              id: oView.getId(),
              controller: this
            }).then(function (oDialog) {
              this._oTipoImpDialog = oDialog;
              oView.addDependent(oDialog);
              this._oTipoImpDialog.open();
            }.bind(this));
          } else {
            this._oTipoImpDialog.open();
          }
        }.bind(this),
        error: function () {
          sap.m.MessageToast.show("Error al cargar tipos de imputación.");
        }
      });
    },
    onTipoImputacionSeleccionado: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("selectedItem");
      if (oSelectedItem) {
        var oContext = oSelectedItem.getBindingContext("TipoImputacionModel");
        if (oContext) {
          var oData = oContext.getObject();
          var sTipoImputacion = oData.TipoImputacion;

          // Usar el contexto de fila guardado (como en onCuentaMayorSeleccionada)
          var oRowContext = this._oTipoImputacionContext; // deberías guardarlo previamente al abrir el value help
          if (oRowContext) {
            var oContratoModel = this.getView().getModel("contratoModel");

            oContratoModel.setProperty(oRowContext.getPath() + "/TipoImputacion", sTipoImputacion);


            this.byId("TipoImputacion").setValue(sTipoImputacion);


          } else {

            this.getView().getModel("TipoImputacionModel").setProperty("/tipoImputacion", sTipoImputacion);
            this.byId("TipoImputacion").setValue(sTipoImputacion);
          }
        }
      }
    },
    onSearchTipoImputacion: function (oEvent) {
      var sQuery = oEvent.getParameter("value");
      var oBinding = oEvent.getSource().getBinding("items");

      var oFilter = new sap.ui.model.Filter({
        filters: [
          new sap.ui.model.Filter("TipoImputacion", sap.ui.model.FilterOperator.Contains, sQuery),
          new sap.ui.model.Filter("Descripcion", sap.ui.model.FilterOperator.Contains, sQuery)
        ],
        and: false
      });

      oBinding.filter([oFilter]);
    },
    onValueHelpDistribucion: function (oEvent) {
      const oInput = oEvent.getSource();
      const oRowContext = oInput.getBindingContext("contratoModel");
      this._oIndDistribucionContext = oRowContext;

      const oView = this.getView();
      const oModel = this.getOwnerComponent().getModel(); // ODataModel

      oModel.read("/VHIndicadorDistribucionSet", {
        success: function (oData) {
          const oDistribModel = new sap.ui.model.json.JSONModel({
            indicadores: oData.results
          });
          oView.setModel(oDistribModel, "IndDistribucionModel");

          if (!this._oIndDistribDialog) {
            sap.ui.core.Fragment.load({
              name: "pluspe.z9451controlhes.fragments.IndDistribucionValueHelp",
              id: oView.getId(),
              controller: this
            }).then(function (oDialog) {
              this._oIndDistribDialog = oDialog;
              oView.addDependent(oDialog);
              this._oIndDistribDialog.open();
            }.bind(this));
          } else {
            this._oIndDistribDialog.open();
          }
        }.bind(this),
        error: function () {
          sap.m.MessageToast.show("Error al cargar indicadores.");
        }
      });
    },
    onIndDistribucionSeleccionado: function (oEvent) {
      const oSelectedItem = oEvent.getParameter("selectedItem");
      if (oSelectedItem) {
        const oContext = oSelectedItem.getBindingContext("IndDistribucionModel");
        if (oContext) {
          const oData = oContext.getObject();
          const sIndDistribucion = oData.IndicadorDis;


          const oRowContext = this._oIndDistribucionContext;
          if (oRowContext) {
            const oContratoModel = this.getView().getModel("contratoModel");
            oContratoModel.setProperty(oRowContext.getPath() + "/IndDistribucion", sIndDistribucion);
            oContratoModel.refresh(true);

            // 🔧 Esta línea es la que te falta:
            this.byId("IndDistr").setValue(sIndDistribucion);
          }
        }
      }

    },

    onGoPress: function () {
      var oView = this.getView();
      var bError = false;

      // Obtener los controles
      var oUsuario = oView.byId("inputUsuario");
      var oUbicacion = oView.byId("inputUbicacion");
      var oTexto = oView.byId("inputTexto");
      var oDesde = oView.byId("inputDesde");
      var oHasta = oView.byId("inputHasta");

      // Obtener valores
      var sUsuario = oUsuario.getValue().trim();
      var sUbicacion = oUbicacion.getValue().trim();
      var sTexto = oTexto.getValue().trim();
      var dDesde = oDesde.getDateValue();
      var dHasta = oHasta.getDateValue();

      // Validar campos de texto
      [
        { control: oUsuario, value: sUsuario },
        { control: oUbicacion, value: sUbicacion },
        { control: oTexto, value: sTexto }
      ].forEach(function (item) {
        if (!item.value) {
          item.control.setValueState("Error");
          bError = true;
        } else {
          item.control.setValueState("None");
        }
      });

      // Validar fechas
      if (!dDesde) {
        oDesde.setValueState("Error");
        bError = true;
      } else {
        oDesde.setValueState("None");
      }

      if (!dHasta) {
        oHasta.setValueState("Error");
        bError = true;
      } else {
        oHasta.setValueState("None");
      }

      // Si hay errores, mostrar mensaje y salir
      if (bError) {
        MessageBox.error("Todos los campos son obligatorios. Por favor, completá correctamente el formulario.");
        return;
      }

      // Construir el modelo con los datos
      var oDatosFormulario = {
        Usuario: sUsuario,
        Ubicacion: sUbicacion,
        TextoBreve: sTexto,
        PeriodoDesde: dDesde,
        PeriodoHasta: dHasta
      };

      var oModel = new sap.ui.model.json.JSONModel(oDatosFormulario);
      // oView.setModel(oModel, "formData");
      this.getOwnerComponent().setModel(oModel, "formData");
      // Continuar con la lógica
      this._llamarOData();
    },



    _llamarOData: function () {
      // Obtener el valor del campo de entrada
      var sOrden = this.getView().byId("inputOrden").getValue();

      // Verificar si el campo está vacío o tiene menos de 10 caracteres
      if (!sOrden || sOrden.length !== 10) {
        // Actualizar el estado del campo a "Error" con un mensaje
        this.getView().byId("inputOrden").setValueState("Error");
        this.getView().byId("inputOrden").setValueStateText("El campo Orden debe tener exactamente 10 caracteres.");
        sap.m.MessageBox.alert("Por favor, complete el campo Orden correctamente.");
        return; // Salir de la función si el campo no es válido
      }

      // Si el campo es válido, restablecer el estado a "None"
      this.getView().byId("inputOrden").setValueState("None");

      var oModel = this.getOwnerComponent().getModel(); // Accede al modelo OData

      var aFilters = [];

      // Verificar si el valor de orden no está vacío
      if (sOrden) {
        aFilters.push(new Filter("Orden", FilterOperator.EQ, sOrden));
      }

      // Realizar la llamada OData con los filtros
      oModel.read("/InPedidosSet", {
        filters: aFilters,
        success: function (oData) {
          if (oData.results.length > 0) {
            // Obtener el valor de Contrato desde el primer resultado
            var sContrato = oData.results[0].Contrato || "Sin Contrato";

            // Crear el modelo JSON con los datos obtenidos
            var oJsonModel = new sap.ui.model.json.JSONModel({
              Ordenes: oData.results,
              Contrato: sContrato  // Almacenar el contrato de manera global en el modelo
            });

            // Asignar el modelo a la vista
            this.getView().setModel(oJsonModel, "OrdenModel");
            //  sap.m.MessageToast.show("Datos cargados correctamente");
          } else {
            sap.m.MessageToast.show("No se encontraron pedidos.");
          }
        }.bind(this),



        error: function (oError) {
          sap.m.MessageToast.show("Error al leer los pedidos");
          console.error(oError);
        }
      });
    }
  });
});