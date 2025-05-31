/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"pluspe/z9451_control_hes/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
