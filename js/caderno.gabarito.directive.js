(function() { 'use strict';

angular
	.module("tec.caderno")
	.directive("tecCadernoGabarito", tecCadernoGabarito);

function tecCadernoGabarito() {
	var directive = {
		restrict: 'E',
		templateUrl: 'cadernoGabarito',
		scope: {
			caderno: '=',
			onAbrirQuestao: '='
		},
		controller: 'TecCadernoGabaritoController',
		controllerAs: 'vm',
        bindToController: true
	};

	return directive;
}

})();
