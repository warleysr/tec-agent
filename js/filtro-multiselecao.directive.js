(function() { 'use strict';

/**
	Componente de filtro.

	Params:
		label:
			Label que acompanha o seletor.
		config:
			Config do componente de multiseleção do jQuery.
		items:
			Dados do seletor. Deve ser uma lista de objetos no seguinte formato:
 				{
 					id: int,
 					nome: string
 				}
		on-selecao-alterada:
			Função que será chamada quando os itens selecionados forem alterados. Deve receber um parametro chamado "selecao".
			Quando todos os itens forem selecionados será retornado uma lista vazia. Não será chamada se remover a seleção de
			todos os itens.
			Note que será retornado a lista dos ids dos objetos selecionados
		chavelocalstorage:
		    Nome da chave no localStorage onde serão salvas as materias selecionadas

 Exemplo:
 	<tec-filtro-multiselecao label="Matéria" items="vm.materias" on-selecao-alterada="vm.onMateriaSelected(selecao)"></tec-filtro-multiselecao>
 */
angular
	.module("tec.componentes")
	.directive("tecFiltroMultiselecao", tecFiltroMultiselecao);

function tecFiltroMultiselecao($sce) {
	var directive = {
		restrict: 'E',
		templateUrl: $sce.trustAsUrl(contextPathUrl + 'js/angular/components/filtro-multiselecao/filtro-multiselecao.template.html?v=' + tecAppVersion),
		scope: {
			label: '@',
			items: '=',
			config: '=',
			onSelecaoAlterada: '&?',
			chavelocalstorage: '@?'
		},
		controller: 'TecFiltroMultiselecaoController',
		controllerAs: 'vm',
        bindToController: true
	};

	return directive;
}

})();
