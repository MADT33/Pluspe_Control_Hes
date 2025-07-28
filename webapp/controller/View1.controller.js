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



      this.byId("contratoTable").attachUpdateFinished(this.onAfterRendering, this);

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

onInputChange: function (oEvent) {
    var oInput = oEvent.getSource();
    var oTable = this.getView().byId("contratoTable");
    var oItem = oInput.getParent().getParent();
    var oContext = oItem.getBindingContext("contratoModel");
    if (!oContext) return;

    var sPath = oContext.getPath();
    var oModel = this.getView().getModel("contratoModel");
    var oData = oModel.getProperty(sPath);
    if (!oData) return;

    // ✅ NO tocar el color si ya hay uno definido
    if (!oData.ColorClase || oData.ColorClase.trim() === "") {
        oModel.setProperty(sPath + "/ColorClase", "filaBlanca");
    }

    var aCells = oItem.getCells();
    var bEsOriginal = oData.EsOriginal === true;
    var sTipoImput = oData.InTipoImput;
    var mostrarInputs = sTipoImput === "U" && !oData.EsClon;

    // Mostrar u ocultar los inputs ocultos en las primeras columnas
    for (var i = 0; i <= 6; i++) {
        var oVBox = aCells[i];
        var oHiddenInput = oVBox.getItems()[1];
        if (oHiddenInput instanceof sap.m.Input) {
            oHiddenInput.setVisible(mostrarInputs);
        }
        if (oVBox.getItems()[0] && oVBox.getItems()[0].setVisible) {
            oVBox.getItems()[0].setVisible(true);
        }
    }

    // ✅ Actualizar la propiedad MostrarBotones en el modelo (solo para esta fila)
    var mostrarBotones = mostrarInputs && bEsOriginal;
    //oModel.setProperty(sPath + "/MostrarBotones", mostrarBotones);
    const iIndex = oContext.getPath().split("/").pop(); // último número del path
    oModel.setProperty("/ContratoDetalle/" + iIndex + "/MostrarBotones", mostrarBotones);

    // Columna entera visible si corresponde (esto es general)
    var oColAccion = this.getView().byId("colAccion");
    oColAccion.setVisible(mostrarBotones);

    // Habilitar botón de guardar si se completó el campo
    var bEnableGuardar = oInput.getValue().trim() !== "";
    this.getView().byId("toggleButton2").setEnabled(bEnableGuardar);
}




    ,
    onFechaHastaChange: function (oEvent) {
      var oView = this.getView();

      // Obtener fechas
      var oFechaDesde = oView.byId("inputDesde").getDateValue();
      var oFechaHasta = oEvent.getSource().getDateValue();

      if (!oFechaDesde || !oFechaHasta) {
        return;
      }

      // Comparar fechas
      if (oFechaHasta < oFechaDesde) {
        sap.m.MessageBox.warning("La fecha 'Hasta' no puede ser menor que la fecha 'Desde'.");

        // Limpiar el campo
        oEvent.getSource().setValue("");

        // También podés resetear el valor en el modelo si estás usando `TwoWay` binding
        var oModel = oView.getModel("detalleModel");
        if (oModel) {
          oModel.setProperty("/hasta", null);
        }
      }
    },
    onConfirmarProyecto: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("selectedItem");
      if (!oSelectedItem) return;

      var oContext = this._currentRowContext;

      if (oContext) {
        var sPath = oContext.getPath();
        var oModel = this.getView().getModel("contratoModel");


        var sId = oSelectedItem.getTitle();
        var sDescripcion = oSelectedItem.getDescription();


        oModel.setProperty(sPath + "/Proyectos", sId);
        oModel.setProperty(sPath + "/DescripcionProyecto", sDescripcion);
      }


      this._oProyectoDialog.close();
    }
    ,
    onCancelProyecto: function () {

      this._currentRowContext = null;
    },
    onSearchProyecto: function (oEvent) {
      var sQuery = oEvent.getParameter("value");

      var oFilterId = new sap.ui.model.Filter("Id", sap.ui.model.FilterOperator.Contains, sQuery);
      var oFilterDesc = new sap.ui.model.Filter("Descripcion", sap.ui.model.FilterOperator.Contains, sQuery);

      var oBinding = oEvent.getSource().getBinding("items");
      oBinding.filter(new sap.ui.model.Filter([oFilterId, oFilterDesc], false));
    },

    onValueHelpProyecto: function (oEvent) {
      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel();


      this._currentRowContext = oEvent.getSource().getBindingContext("contratoModel");


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
    }
    ,

    onAccionPress: function (oEvent) {
      var oButton = oEvent.getSource();
      var oContext = oButton.getBindingContext("contratoModel");

      if (!oContext) return;

      var sPath = oContext.getPath();
      var oModel = oContext.getModel();
      var oOriginalData = oModel.getProperty(sPath);

      var oClonedData = JSON.parse(JSON.stringify(oOriginalData));

      // Limpieza de campos
      oClonedData.CuentaMayor = "";
      oClonedData.CentroCoste = "";
      oClonedData.Orden = "";
      oClonedData.TipoImputacion = "";
      oClonedData.IndDistribucion = "";
      oClonedData.CantPorc = "";
      oClonedData.ImporteNuevo = "";
      oClonedData.Proyectos = "";

      oClonedData.EsOriginal = false;
      oClonedData.EsClon = true;

      // ID único
      if (!oOriginalData.IdOriginal) {
        oOriginalData.IdOriginal = Date.now().toString() + Math.random().toString(36).substr(2, 6);
        oModel.setProperty(sPath + "/IdOriginal", oOriginalData.IdOriginal);
      }
      oClonedData.IdOriginal = oOriginalData.IdOriginal;

      // ID único del nuevo ítem
      oClonedData.ClonId = Date.now().toString() + Math.random().toString(36).substr(2, 6);

      // Visibilidad
      oClonedData.CuentaMayorVisible = true;
      oClonedData.CentroCostoVisible = true;
      oClonedData.OrdenVisible = true;
      oClonedData.TipoImputacionVisible = false;
      oClonedData.IndicadorDistribucionVisible = false;
      oClonedData.CantidadPorcentajeVisible = true;

      oClonedData.MostrarBotones = false;

      // Insertar el clon directamente
      var aPathParts = sPath.split("/");
      var iIndex = parseInt(aPathParts[aPathParts.length - 1], 10);
      var aData = oModel.getProperty("/ContratoDetalle");

      aData.splice(iIndex + 1, 0, oClonedData);
      oModel.setProperty("/ContratoDetalle", aData); // sólo si necesitás actualizar completamente

      // Mejor aún: actualizar solo el ítem clonado
      // oModel.setProperty("/ContratoDetalle/" + (iIndex + 1), oClonedData);

      this.byId("contratoTable").getBinding("items").refresh(true);

      // Esperar a que se re-renderice la tabla y los clones
      setTimeout(() => {
        const aItems = this.byId("contratoTable").getItems();
        aItems.forEach(item => {
          const oClonId = item.getBindingContext("contratoModel").getProperty("ClonId");
          const bEsClon = item.getBindingContext("contratoModel").getProperty("EsClon");

          if (bEsClon && oClonId) {
            const oInput = item.getCells().find(cell => cell.data("ClonId") === oClonId);
            if (oInput) {
              oInput.addStyleClass("mm");
            }
          }
        });
      }, 1000);



    }

    ,
    //////////////////////// cebra/////////////////////////////////////////////////////

    _alternarColorPadre: function () {
      this._ultimoColor = this._ultimoColor === "filaGris" ? "filaBlanca" : "filaGris";
      return this._ultimoColor;
    },




    onAccionPress2: function (oEvent) {
      var oButton = oEvent.getSource();
      var oContext = oButton.getBindingContext("contratoModel");

      if (!oContext) {
        return;
      }

      var sPathOriginal = oContext.getPath();
      var oModel = oContext.getModel();
      var aData = oModel.getProperty("/ContratoDetalle");
      var oOriginalData = oModel.getProperty(sPathOriginal);
      var sIdOriginal = oOriginalData.IdOriginal;

      if (!sIdOriginal) {
        sap.m.MessageToast.show("IdOriginal no definido para esta fila.");
        return;
      }

      var iLastClonIndex = -1;
      for (var i = aData.length - 1; i >= 0; i--) {
        if (aData[i].EsClon === true && aData[i].IdOriginal === sIdOriginal) {
          iLastClonIndex = i;
          break;
        }
      }

      if (iLastClonIndex === -1) {
        sap.m.MessageToast.show("No hay clones para eliminar.");
        return;
      }

      aData.splice(iLastClonIndex, 1);
      oModel.setProperty("/ContratoDetalle", aData);
      this.byId("contratoTable").getBinding("items").refresh(true);
    }

    ,

    onAfterRendering: function () {
      var oTable = this.byId("contratoTable");
      var aItems = oTable.getItems();

      aItems.forEach(function (oItem) {
        var sClase = oItem.data("colorClase");
        if (sClase) {
          oItem.$().addClass(sClase);
        }
      });
    },

    _updateVisibleInputsForRow: function (iRowIndex) {
      var oTable = this.byId("contratoTable");
      var oItem = oTable.getItems()[iRowIndex];
      if (!oItem) {
        return;
      }

      var aCells = oItem.getCells();


      var oVBoxDescripcion = aCells[1];
      var oTextDescripcion = oVBoxDescripcion.getItems()[0];
      var sDescripcion = oTextDescripcion.getText().trim();

      var mostrarInputs = sDescripcion.endsWith("U");


      var oModel = this.getView().getModel("contratoModel");
      var oData = oModel.getProperty("/ContratoDetalle")[iRowIndex];


      for (var i = 0; i <= 5; i++) {
        var oVBox = aCells[i];
        var oHiddenInput = oVBox.getItems()[1];
        if (oHiddenInput instanceof sap.m.Input) {
          oHiddenInput.setVisible(mostrarInputs);
        }
      }


      var oHBoxBotones = aCells[8];
      var aBotones = oHBoxBotones.getItems();
      var mostrarBotones = mostrarInputs && oData.EsOriginal === true;

      aBotones.forEach(function (oBoton) {
        oBoton.setVisible(mostrarBotones);
      });
    }

    ,

    onItemPress: function (oEvent) {

      var oView = this.getView();

      var Usuario = oView.byId("inputUsuario").getValue();
      var Ubicacion = oView.byId("inputUbicacion").getValue();
      var TextoBreve = oView.byId("inputTexto").getValue();
      var PeriodoDesde = oView.byId("inputDesde").getDateValue();
      var PeriodoHasta = oView.byId("inputHasta").getDateValue();
      var sOrden = oView.byId("inputOrden").getValue();


      var oGlobalData = {
        Usuario: Usuario,
        Ubicacion: Ubicacion,
        TextoBreve: TextoBreve,
        PeriodoDesde: PeriodoDesde,
        PeriodoHasta: PeriodoHasta,
        Orden: sOrden
      };




      var oGlobalModel = new sap.ui.model.json.JSONModel(oGlobalData);
      this.getOwnerComponent().setModel(oGlobalModel, "globalModel");


      var oItem = oEvent.getParameter("listItem") || oEvent.getSource();


      var oContext = oItem.getBindingContext("OrdenModel");

      if (oContext) {

        var sOrden = oContext.getProperty("Orden");
        var sOrdenPosicion = oContext.getProperty("OrdenPosicion");


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


      var bExpanded = oPanel.getExpanded();
      oPanel.setExpanded(!bExpanded);


      var oViewModel = this.getView().getModel("OrdenModel");
      var sContrato = oViewModel.getProperty("/Contrato");

      var oDataModel = this.getOwnerComponent().getModel();
      var that = this;


      if (!sContrato) {
        sap.m.MessageToast.show("Número de contrato no encontrado.");
        return;
      }


      var aFilters = [
        new sap.ui.model.Filter("Contrato", sap.ui.model.FilterOperator.EQ, sContrato)
      ];


      oDataModel.read("/InContratoDetSet", {
        filters: aFilters,
        success: function (oData) {
          if (oData && oData.results.length > 0) {


            oData.results.forEach(function (item) {
              item.EsOriginal = true;

              item.MostrarBotones = false;
              item.CuentaMayorVisible = false;
              item.CentroCostoVisible = false;
              item.OrdenVisible = false;
              item.TipoImputacionVisible = false;
              item.IndicadorDistribucionVisible = false;
              item.CantidadPorcentajeVisible = false;

              item.CuentaMayorEnabled = true;
              item.CentroCostoEnabled = true;
              item.OrdenEnabled = true;
            });



            var ultimoColor = "filaGris";
            oData.results.forEach(function (item) {
              item.EsOriginal = true;
              item.ColorClase = ultimoColor;
              ultimoColor = (ultimoColor === "filaGris") ? "filaBlanca" : "filaGris";
            });


            var oContratoModel = that.getView().getModel("contratoModel");
            oContratoModel.setProperty("/ContratoDetalle", oData.results);


            var oTable = that.byId("contratoTable");
            if (oTable && oTable.getBinding("items")) {
              oTable.getBinding("items").refresh(true);
            }

            sap.m.MessageToast.show("Datos cargados correctamente.");
          } else {
            sap.m.MessageToast.show("No hay registros para el contrato seleccionado.");
          }
        },
        error: function () {
          sap.m.MessageToast.show("Error al consultar el contrato.");
        }
      });
    }
    ,
    ContinuarProceso: function () {
      const toYYYYMMDD = function (date) {
        if (!(date instanceof Date)) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
      };

      var oView = this.getView();
      var oTable = oView.byId("contratoTable");
      var aItems = oTable.getItems();
      var aDeepEntityItems = [];


      var Usuario = oView.byId("inputUsuario").getValue();
      var Ubicacion = oView.byId("inputUbicacion").getValue();
      var TextoBreve = oView.byId("inputTexto").getValue();
      var PeriodoDesde = oView.byId("inputDesde").getDateValue();
      var PeriodoHasta = oView.byId("inputHasta").getDateValue();
      var sOrden = oView.byId("inputOrden").getValue();

      var oGlobalData = {
        Usuario: Usuario,
        Ubicacion: Ubicacion,
        TextoBreve: TextoBreve,
        PeriodoDesde: toYYYYMMDD(PeriodoDesde),
        PeriodoHasta: toYYYYMMDD(PeriodoHasta),
        Orden: sOrden
      };

      var oGlobalModel = new sap.ui.model.json.JSONModel(oGlobalData);
      this.getOwnerComponent().setModel(oGlobalModel, "globalModel");


      console.log("📊 Total de filas en la tabla:", aItems.length);


      const debeIncluirseEnPayload = function (oData) {

        const tieneImporte = oData.ImporteNuevo && oData.ImporteNuevo !== "0" && oData.ImporteNuevo !== 0;
        const tieneDatosClon = !oData.EsOriginal && (
          oData.CuentaMayor || oData.CentroCoste || oData.Orden || oData.TipoImputacion || oData.IndDistribucion || oData.Proyectos
        );
        return tieneImporte || tieneDatosClon;
      };

      aItems.forEach(function (oItem, index) {
        var oContext = oItem.getBindingContext("contratoModel");
        if (!oContext) {
          console.warn("⛔ Sin contexto en item", index);
          return;
        }

        var oData = oContext.getObject();
        if (!oData) {
          console.warn("⛔ Sin datos en contexto de item", index);
          return;
        }

        console.log(`🔍 Item ${index}:`, oData);

        if (!debeIncluirseEnPayload(oData)) {
          console.log(`⚠️ Item ${index} excluido del payload (sin datos relevantes)`);
          return;
        }


        var oEntry = {
          Contrato: oData.Contrato,
          Orden: sOrden,
          OrdenPosicion: oData.OrdenPosicion,
          DescripcionContrato: oData.DescripcionContrato,
          NroServicio: oData.NroServicio,
          Descripcion: oData.Descripcion,
          Cantidad: oData.Cantidad,
          Usado: oData.Usado,
          Restante: oData.Restante,
          ImporteNuevo: oData.ImporteNuevo,
          Usuario: Usuario,
          Ubicacion: Ubicacion,
          TextoBreve: TextoBreve,
          PeriodoDesde: toYYYYMMDD(PeriodoDesde),
          PeriodoHasta: toYYYYMMDD(PeriodoHasta),
          CuentaMayor: oData.CuentaMayor || "",
          CentroCoste: oData.CentroCoste || "",
          OrdenInput: oData.Orden || "",
          CantPorc: oData.CantPorc || "",
          TipoImputacion: oData.TipoImputacion || "",
          IndDistribucion: oData.IndDistribucion || "",
          Proyectos: oData.Proyectos || "",

        };

        aDeepEntityItems.push(oEntry);
      });


      console.log("✅ Payload final:", aDeepEntityItems);

      if (aDeepEntityItems.length > 0) {
        var oModel = this.getOwnerComponent().getModel();

        var oPayload = {
          Key: "X",
          HeaderToContratosNav: aDeepEntityItems
        };

        oView.setBusy(true);

        oModel.create("/HeaderSet", oPayload, {
          success: function (oData) {

            var oView = this.getView();
            oView.setBusy(false);

            // Obtener los mensajes desde la navegación expandida
            var aResultados = oData.HeaderToContratosNav?.results || [];

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

      }
    },
    onCloseDialog: function () {
      if (this._oMessageDialog) {
        this._oMessageDialog.close();
      }
    },
    onValueHelpUsuario: function () {


      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel();


      oModel.read("/UsuariosSet", {
        success: function (oData) {

          var oUsuariosModel = new sap.ui.model.json.JSONModel({
            usuarios: oData.results
          });
          oView.setModel(oUsuariosModel, "usuariosModel");


          if (!this._oUsuarioDialog) {
            sap.ui.core.Fragment.load({
              name: "pluspe.z9451controlhes.fragments.UsuarioValueHelp",
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


      var oBinding = oEvent.getSource().getBinding("items");
      oBinding.filter(aFilters);
    },
    onUsuarioSeleccionado: function (oEvent) {
      var oSelectedItem = oEvent.getParameter("selectedItem");
      if (oSelectedItem) {

        var oContext = oSelectedItem.getBindingContext("usuariosModel");
        var sNombre = oContext.getProperty("Nombre");


        this.byId("inputUsuario").setValue(sNombre);

      }


    },
    onCentroCosteChange: function (oContext) {
      if (!oContext) return;

      const oModel = this.getView().getModel("contratoModel");
      const sPath = oContext.getPath();
      const sValorCentro = oModel.getProperty(sPath + "/CentroCoste");


      if (sValorCentro && sValorCentro.trim() !== "") {
        oModel.setProperty(sPath + "/Orden", "");
        oModel.setProperty(sPath + "/OrdenEnabled", false);
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
      var oRow = oInputOrden.getParent().getParent();


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
      var oModel = this.getOwnerComponent().getModel();

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


          const oRowContext = this._oCuentaMayorContext;
          if (oRowContext) {
            const oContratoModel = this.getView().getModel("contratoModel");
            oContratoModel.setProperty(oRowContext.getPath() + "/CuentaMayor", sNumCuenta);


            this.onCuentaMayorChange({
              getSource: () => {
                const oTable = this.byId("contratoTable");
                const aItems = oTable.getItems();
                for (let i = 0; i < aItems.length; i++) {
                  const oCtx = aItems[i].getBindingContext("contratoModel");
                  if (oCtx === oRowContext) {
                    const oVBox = aItems[i].getCells()[1];
                    return oVBox.getItems()[1];
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
      this._oTipoImputacionContext = oRowContext;



      var oView = this.getView();
      var oModel = this.getOwnerComponent().getModel();

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


          var oRowContext = this._oTipoImputacionContext;
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
      const oModel = this.getOwnerComponent().getModel();
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


          }
        }
      }
    },

    onGoPress: function () {
      var oView = this.getView();
      var bError = false;


      var oUsuario = oView.byId("inputUsuario");
      var oUbicacion = oView.byId("inputUbicacion");
      var oTexto = oView.byId("inputTexto");
      var oDesde = oView.byId("inputDesde");
      var oHasta = oView.byId("inputHasta");


      var sUsuario = oUsuario.getValue().trim();
      var sUbicacion = oUbicacion.getValue().trim();
      var sTexto = oTexto.getValue().trim();
      var dDesde = oDesde.getDateValue();
      var dHasta = oHasta.getDateValue();


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


      if (bError) {
        MessageBox.error("Todos los campos son obligatorios. Por favor, completá correctamente el formulario.");
        return;
      }


      var oDatosFormulario = {
        Usuario: sUsuario,
        Ubicacion: sUbicacion,
        TextoBreve: sTexto,
        PeriodoDesde: dDesde,
        PeriodoHasta: dHasta
      };

      var oModel = new sap.ui.model.json.JSONModel(oDatosFormulario);
      this.getOwnerComponent().setModel(oModel, "formData");

      this._llamarOData();
    },



    _llamarOData: function () {

      var sOrden = this.getView().byId("inputOrden").getValue();


      if (!sOrden || sOrden.length !== 10) {

        this.getView().byId("inputOrden").setValueState("Error");
        this.getView().byId("inputOrden").setValueStateText("El campo Orden debe tener exactamente 10 caracteres.");
        sap.m.MessageBox.alert("Por favor, complete el campo Orden correctamente.");
        return;
      }


      this.getView().byId("inputOrden").setValueState("None");

      var oModel = this.getOwnerComponent().getModel();

      var aFilters = [];


      if (sOrden) {
        aFilters.push(new Filter("Orden", FilterOperator.EQ, sOrden));
      }


      oModel.read("/InPedidosSet", {
        filters: aFilters,
        success: function (oData) {
          if (oData.results.length > 0) {

            var sContrato = oData.results[0].Contrato || "Sin Contrato";


            var oJsonModel = new sap.ui.model.json.JSONModel({
              Ordenes: oData.results,
              Contrato: sContrato
            });


            this.getView().setModel(oJsonModel, "OrdenModel");

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