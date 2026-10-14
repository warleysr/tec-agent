(function() { 'use strict';

angular
	.module("tec.componentes")
	.controller("TecFiltroPeriodoController", TecFiltroPeriodoController);

TecFiltroPeriodoController.$inject = ["$rootScope", "$scope"];

function TecFiltroPeriodoController($rootScope, $scope) {
	var vm = this;

	vm.callbackDateRangePicker = callbackDateRangePicker;
	vm.inicioDefault = moment().subtract(6, 'days');
	vm.fimDefault = moment();

	if (!vm.configuracaoDatePicker) {
		vm.configDateRangePicker = {
			ranges: {
				'Hoje': [moment(), moment()],
				'Ontem': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
				'Últimos 7 dias': [moment().subtract(6, 'days'), moment()],
				'Últimos 15 dias': [moment().subtract(14, 'days'), moment()],
				'Este mês': [moment().startOf('month'), moment().endOf('month')],
				'Mês passado': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
				'Últimos 6 meses': [moment().subtract(6, 'month').startOf('month'), moment()],
				'Último ano': [moment().subtract(12, 'month').startOf('month'), moment()]
			},
			"locale": {
				"format": "DD/MM/YYYY",
				"separator": " - ",
				"applyLabel": "Selecionar",
				"cancelLabel": "Cancelar",
				"fromLabel": "Até",
				"toLabel": "De",
				"customRangeLabel": "Customizado",
				"daysOfWeek": [
					"D",
					"S",
					"T",
					"Q",
					"Q",
					"S",
					"S"
				],
				"monthNames": [
					"Janeiro",
					"Fevereiro",
					"Março",
					"Abril",
					"Maio",
					"Junho",
					"Julho",
					"Agosto",
					"Setembro",
					"Outubro",
					"Novembro",
					"Dezembro"
				],
				"firstDay": 1
			},
			"startDate": vm.inicioDefault,
			"endDate": vm.fimDefault,
			"maxDate": vm.fimDefault,
			"minYear": "2013"
		}
		
	} else {
		vm.configDateRangePicker = vm.configuracaoDatePicker;
	}

	activate();

	function activate() {
		var inicio = vm.inicioDefault;
		var fim = vm.fimDefault;

		if (vm.datainicial) {
			vm.configDateRangePicker.ranges['Tudo'] = [moment(vm.datainicial), moment()];
		}

		if (vm.forcarDia && $.isAssinanteLogado()) {
			var dia = moment(vm.forcarDia);
			inicio = dia;
			fim = dia;
		} else if (vm.chaveDataSalva && localStorage.getItem(vm.chaveDataSalva + "["+userId+"]")) {
			var dataSalva = JSON.parse(localStorage.getItem(vm.chaveDataSalva + "["+userId+"]"));

			if (dataSalva.label === "Customizado") {
				inicio = moment(dataSalva.inicio);
				fim = moment(dataSalva.fim);
			} else {
				var datas = vm.configDateRangePicker.ranges[dataSalva.label];
				inicio = datas[0];
				fim = datas[1];
			}
		}

		if (vm.onSelecaoAlterada) {
			vm.onSelecaoAlterada({ selecionado: { inicio, fim } });
		}
		
		$rootScope.$emit("filtroAtivado");
	}

	function callbackDateRangePicker(inicio, fim, label) {
		if (vm.onSelecaoAlterada) {
			vm.onSelecaoAlterada({ selecionado: { inicio, fim } });
		}
	}
}

})();
