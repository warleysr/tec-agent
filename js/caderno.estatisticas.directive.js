(function() { 'use strict';

angular
	.module("tec.caderno")
	.directive("tecCadernoEstatisticas", tecCadernoEstatisticas);

function tecCadernoEstatisticas() {
	var directive = {
		restrict: 'E',
		templateUrl: 'cadernoEstatisticas',
		scope: {
			caderno: '=',
			idPasta: '@'
		},
		controller: 'TecCadernoEstatisticasController',
		controllerAs: 'vm',
        bindToController: true
	};

	return directive;
}

})();
