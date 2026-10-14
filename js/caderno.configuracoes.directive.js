(function() { 'use strict';

angular
	.module("tec.caderno")
	.directive("tecCadernoConfiguracoes", tecCadernoConfiguracoes);

function tecCadernoConfiguracoes() {
	var directive = {
		restrict: 'E',
		templateUrl: 'cadernoConfiguracoes',
		scope: {
			caderno: '=',
			idPasta: '@'
		},
		controller: 'TecCadernoConfiguracoesController',
		controllerAs: 'vm',
        bindToController: true
	};

	return directive;
}

})();
