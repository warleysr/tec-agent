(function() { 'use strict';

angular
	.module("tec.caderno")
	.directive("tecCadernoIndice", tecCadernoIndice);

function tecCadernoIndice() {
	var directive = {
		restrict: 'E',
		templateUrl: 'cadernoIndice',
		scope: {
			caderno: '=',
			onAbrirQuestao: '='
		},
		controller: 'TecCadernoIndiceController',
		controllerAs: 'vm',
        bindToController: true
	};

	return directive;
}

})();
