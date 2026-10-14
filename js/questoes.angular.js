(function() {

var module = angular.module("tec.questoes", [ "ngRoute", "tec.common", "tec.questao", "chart.js", "tec.questao-teoria", "tec.caderno"]);

module.config(function($routeProvider, $locationProvider) {	
	$routeProvider
	.when("/", {
		redirectTo: "/pastas"
	})
	.when("/cadernos", {
		redirectTo: "/pastas"
	})
	.when("/cadernos/:id", {
		redirectTo: "/pastas"
	})
	.when("/pastas", {
		templateUrl: "pastas",
		controller: "PastasQuestoesCtrl",
		controllerAs: "vm"
	})
	.when("/pastas/:id", {
		templateUrl: "cadernos",
		controller: "CadernosQuestoesCtrl",
		controllerAs: "vm"
	})
	.when("/cadernos-lixeira", {
		templateUrl: "cadernos-lixeira",
		controller: "CadernosQuestoesLixeiraCtrl",
		controllerAs: "vm"
	})
	.when("/desempenho", {
		templateUrl: "desempenho",
		controller: "DesempenhoQuestoesCtrl",
		controllerAs: "vm"
	})
	.when("/evolucao", {
		templateUrl: "evolucao",
		controller: "EvolucaoQuestoesCtrl",
		controllerAs: "vm"
	})
	.when("/favoritas", {
		templateUrl: "pastasFavoritas",
		controller: "TecPastasQuestoesFavoritasController",
		controllerAs: "vm"
	})
	.when("/favoritas/pasta/:id/questao/:idQuestao", {
		templateUrl: "favoritas",
		controller: "FavoritasQuestoesCtrl",
		controllerAs: "vm"
	})
	.when("/favoritas/pasta/:id", {
		templateUrl: "favoritas",
		controller: "FavoritasQuestoesCtrl",
		controllerAs: "vm"
	})
	.when("/discussao", {
		redirectTo: "/discussao/acompanhadas"
	})
	.when("/discussao/:filtro", {
		templateUrl: "discussao",
		controller: "DiscussaoQuestoesCtrl",
		controllerAs: "vm"
	})
	.when("/busca", {
		templateUrl: "busca",
		controller: "BuscaQuestoesCtrl",
		controllerAs: "vm"
	});
	
	$locationProvider.html5Mode(true).hashPrefix("!");
});

module.controller("MainQuestoesCtrl", function($rootScope, $location, $window) {
	var main = this;
	main.questoesFiltro = questoesFiltro;
	main.mostrarAlertaExclusivoParaAssinantes = mostrarAlertaExclusivoParaAssinantes;

	$rootScope.$on("$viewContentLoaded", function() {
		main.menuAtivo = $location.path().split("/")[1];
	});
	
	function questoesFiltro() {
		$window.location.href = contextPathUrl + "questoes/filtrar";
	}

	function mostrarAlertaExclusivoParaAssinantes() {
		$.alerts.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	}
});


})();
