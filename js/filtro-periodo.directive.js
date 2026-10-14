(function() { 'use strict';

/**
	Componente de filtro de periodo, usando o Date Range Picker (https://www.daterangepicker.com/).

	Params:
		on-selecao-alterada:
			Função que será chamada quando o item selecionado for alterado. Deve receber um parametro chamado "selecionado".
			Ele será um objeto contendo a data de inicio e fim, no seguinte formato:
				{
					inicio: moment(),
					fim: moment()
				}
		chave-data-salva:
        	Nome da chave com qual a data selecionada vai ser salva no localStorage
		data-inicial-cadastro-usuario:
        	Data que será considerada como inicial no periodo customizado do calendario chamado "Tudo".
		forcar-dia:
			Forçar a data selecionada a ser o dia passado (só assinantes.
			Tem prioridade sobre o que está salvo no localStorage

	Eventos ouvidos:
		resetarFiltroPeriodo:
			Faz o componente voltar a exibir o periodo padrao (ultimos 7 dias).

 Exemplo:
 	<tec-filtro-periodo on-selecao-alterada="vm.onPeriodoSelecionado(selecionado)"></tec-filtro-periodo>
 */
angular
	.module("tec.componentes")
	.directive("tecFiltroPeriodo", tecFiltroPeriodo);

function tecFiltroPeriodo($sce) {
	var directive = {
		restrict: 'E',
		templateUrl: $sce.trustAsUrl(contextPathUrl + 'js/angular/components/filtro-periodo/filtro-periodo.template.html?v=' + tecAppVersion),
		scope: {
			onSelecaoAlterada: '&?',
            chaveDataSalva: '@?',
            datainicial:'@?',
            forcarDia:'@?',
			configuracaoDatePicker: '=?'
		},
		controller: 'TecFiltroPeriodoController',
		controllerAs: 'vm',
        bindToController: true,
        link: link
	};

	function link(scope, element, attrs, vm) {
		var input = element.find("input[name='daterange']");

		if (vm.forcarDia && $.isAssinanteLogado()) {
			var dia = moment(vm.forcarDia);
			vm.configDateRangePicker["startDate"] = dia;
			vm.configDateRangePicker["endDate"] = dia;
		} else if (vm.chaveDataSalva) {
			if (!$.isAssinanteLogado()) {
				localStorage.removeItem(vm.chaveDataSalva + "["+userId+"]")
			} else {
				setupCalbackSalvarDatas(vm, input);

				if (localStorage.getItem(vm.chaveDataSalva + "["+userId+"]")) {
					buscarDataSalva(vm);
				}
			}
		}

		input.daterangepicker(vm.configDateRangePicker, vm.callbackDateRangePicker);

		scope.$on("resetarFiltroPeriodo", function() {
			var picker = input.data("daterangepicker");

			if (!picker) {
				return;
			}

			picker.setStartDate(vm.inicioDefault);
			picker.setEndDate(vm.fimDefault);
		});
	}

	function setupCalbackSalvarDatas(vm, input) {
		input.on('apply.daterangepicker', function (event, picker) {
			var inicio = {};
			var fim = {};

			if (picker.chosenLabel === "Customizado") {
				inicio = picker.startDate;
				fim = picker.endDate;
			}

			localStorage.setItem(vm.chaveDataSalva + "["+userId+"]", JSON.stringify({ inicio, fim, label: picker.chosenLabel }));
		});
	}

	function buscarDataSalva(vm) {
		var dataSalva = JSON.parse(localStorage.getItem(vm.chaveDataSalva + "["+userId+"]"));

		if (dataSalva.label === "Customizado") {
			vm.configDateRangePicker["startDate"] = moment(dataSalva.inicio);
			vm.configDateRangePicker["endDate"] = moment(dataSalva.fim);
		} else {
			var datas = vm.configDateRangePicker.ranges[dataSalva.label];
			vm.configDateRangePicker["startDate"] = datas[0];
			vm.configDateRangePicker["endDate"] = datas[1];
		}
	}

	return directive;
}

})();
