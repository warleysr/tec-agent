(function() { 'use strict';

angular
	.module("tec.componentes")
	.controller("TecFiltroMultiselecaoController", TecFiltroMultiselecaoController);

TecFiltroMultiselecaoController.$inject = ["$scope"];

function TecFiltroMultiselecaoController($scope) {
	var vm = this;

	vm.selecionados = [];
	vm.configuracaoMultiselecaoBase = {
		includeSelectAllOption: true,
		selectAllNumber: false,
		enableFiltering: true,
		enableCaseInsensitiveFiltering: true,
		filterPlaceholder: 'Buscar',
		numberDisplayed: 3,
	};
	vm.configuracaoMultiselecao = $.extend({}, vm.configuracaoMultiselecaoBase, vm.config);
	vm.onAlteracao = onAlteracao;

	activate();

	function activate() {
		$scope.$watch("vm.items", function (dados) {
			if (dados) {
				carregarDoLocalStorage(dados);
			}
		});
	}
	
	function carregarDoLocalStorage(dados) {
		if (vm.chavelocalstorage) {
			if (!$.isAssinanteLogado()) {
				localStorage.removeItem(vm.chavelocalstorage + "["+userId+"]");
				vm.selecionados = dados;
			} else {
				if (localStorage.getItem(vm.chavelocalstorage + "["+userId+"]")) {
					console.log('carregar dados do localstorage: ' + vm.chavelocalstorage + "["+userId+"]");
					var idsJson = JSON.parse(localStorage.getItem(vm.chavelocalstorage + "["+userId+"]"));
					if (idsJson.ids && idsJson.ids.length == 0) {
						vm.selecionados = dados;
					} else {
						vm.selecionados = obterListaDeMateriasPelosIds(idsJson, dados);
					}
				} else {
					vm.selecionados = dados;
				}
			}
		} else {
			vm.selecionados = dados;
		}
		vm.onAlteracao();
	}

	function onAlteracao() {
		if (!vm.onSelecaoAlterada || vm.selecionados.length === 0) {
			return;
		}

		var idsSelecao = [];
		if (vm.selecionados.length === vm.items.length) {
			vm.onSelecaoAlterada({ selecao: idsSelecao });
		} else {
			idsSelecao = obterListaDeIds()
			vm.onSelecaoAlterada({ selecao: idsSelecao });
		}
		
		//salva alteração no localstorage:
		if (vm.chavelocalstorage && $.isAssinanteLogado()) {
			console.log('salvar alterações no localstorage')
			console.log(idsSelecao);
			localStorage.setItem(vm.chavelocalstorage + "["+userId+"]", JSON.stringify({ ids: idsSelecao }));
		}
	}

	function obterListaDeIds() {
		var ids = [];

		for (var i = 0; i < vm.selecionados.length; i++) {
			ids.push(vm.selecionados[i].id);
		}

		return ids;
	}
	
	function obterListaDeMateriasPelosIds(idsJson, dados) {
		var idsLista = [];

		var ids = idsJson.ids;
		idsLista = $.grep(dados, function(objeto) {
	       return $.inArray(objeto.id, ids) !== -1;
	     });
		console.log(idsLista);
		return idsLista;
	}
}

})();
