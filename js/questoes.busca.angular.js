(function() {

var module = angular.module("tec.questoes");

module.config(function($routeProvider, $locationProvider) {	
	$routeProvider
	.when("/busca/!:enunciado/:questao", {
		templateUrl: "busca",
		controller: "BuscaQuestoesCtrl",
		controllerAs: "vm"
	});
	
	$locationProvider.html5Mode(true).hashPrefix("!");
});


module.controller("BuscaQuestoesCtrl", function($scope, $timeout, tecDadosBusca, paramService) {
	var vm = angular.extend(this, {
		dados: tecDadosBusca,
		buscar: buscar,
		existePesquisaAnterior: false,
		atualizarPesquisa: atualizarPesquisa,
		limparEnunciado: limparEnunciado,
		submitFormGerarCaderno: submitFormGerarCaderno,
		contador: contador,
		habilitarBusca: true
	});

	vm.enunciadoAtual = null;

	vm.quantidadeEncontrada = null;
	vm.caderno = { idCaderno: 0, cadernoHash: null };
	vm.questoes = null;
	vm.quantidadePorPagina = 100;

	vm.questaoSeguinte = questaoSeguinte;
	vm.questaoAnterior = questaoAnterior;
	vm.abrirQuestaoPorNumero = abrirQuestaoPorNumero;

	$scope.indiceQuestaoAtual = 0;
	
	verificarBuscaAnterior();
	
	function verificarBuscaAnterior() {
		if(tecDadosBusca.existePesquisaSalva()) {
			vm.existePesquisaAnterior = true;
		}

		$timeout(function() {
			$("#busca").focus();
		}, 0);

		//atualizarPorParemetros();
	}
	
	function atualizarPorParemetros() {
		if(paramService.isParams()) {
			var params = paramService.toJson();
			var enunciado = params.enunciado;
			var questao = params.questao;
			vm.enunciado = enunciado;
			tecDadosBusca.buscarQuestoesPorEnunciado(enunciado, questao, $scope);
		}
	}
	
	function atualizarPesquisa() {
		tecDadosBusca.atualizarPesquisa($scope, vm);
		vm.existePesquisaAnterior = false;
	}
	
	function limparEnunciado() {
		vm.habilitarBusca = true;
		vm.enunciado = null;
		vm.enunciadoAtual = null;
		$("#busca").focus();
	}

	function buscar(enunciado) {
		vm.enunciadoAtual = enunciado;
		tecDadosBusca.buscarQuestoes(enunciado)
			.then(function(data) {
				inicializarArray(data);
			});
	}

	function inicializarArray(dados) {
		vm.quantidadeEncontrada = dados.total;

		var questoes = dados.questoes;
		var quantidadeRetornada = questoes.length;

		vm.questoes = [];

		for (var i = 0; i < quantidadeRetornada; i++) {
			vm.questoes[i] = questoes[i];
		}

		for (var i = quantidadeRetornada; i < vm.quantidadeEncontrada; i++) {
			vm.questoes[i] = null;
		}
	}

	function submitFormGerarCaderno() {
		$(".questoes-busca-gerar-caderno").submit();
	}
	
	function contador(enunciado) {
		if(enunciado != null && enunciado != "" && enunciado.length > 1 && enunciado.indexOf("#") == 0 && $.isNumeric(enunciado.substring(1))) {
			vm.habilitarBusca = false;
		} else if(enunciado.length >= 4){
			vm.habilitarBusca = false;
		} else {
			vm.habilitarBusca = true;
		}
	}

	// Navegação questões

	function questaoSeguinte(indiceQuestaoAtual, callbackAbrirQuestaoDeslogado) {
		if(vm.questoes[indiceQuestaoAtual] == null) {
			buscarMaisAbrirQuestao(indiceQuestaoAtual, callbackAbrirQuestaoDeslogado);
		} else {
			callbackAbrirQuestaoDeslogado(indiceQuestaoAtual);
		}
	}

	function questaoAnterior(indiceQuestaoAtual, callbackAbrirQuestaoDeslogado) {
		if(vm.questoes[indiceQuestaoAtual] == null) {
			buscarMaisAbrirQuestao(indiceQuestaoAtual, callbackAbrirQuestaoDeslogado);
		} else {
			callbackAbrirQuestaoDeslogado(indiceQuestaoAtual);
		}
	}

	function abrirQuestaoPorNumero(indiceQuestaoAtual, callbackAbrirQuestaoDeslogado) {
		if(vm.questoes[indiceQuestaoAtual] == null) {
			buscarMaisAbrirQuestao(indiceQuestaoAtual, callbackAbrirQuestaoDeslogado);
		} else {
			callbackAbrirQuestaoDeslogado(indiceQuestaoAtual);
		}
	}

	function buscarMaisAbrirQuestao(indiceQuestaoAtual, callbackAbrirQuestaoDeslogado) {
		var pagina = Math.floor(indiceQuestaoAtual / vm.quantidadePorPagina) + 1

		tecDadosBusca.buscarQuestoes(vm.enunciadoAtual, pagina)
			.then(function(data) {
				var questoes = data.questoes;

				for (var i = 0; i < questoes.length; i++) {
					var indiceGeral = (pagina - 1) * vm.quantidadePorPagina + i;
					vm.questoes[indiceGeral] = questoes[i];
				}

				callbackAbrirQuestaoDeslogado(indiceQuestaoAtual);
			});
	}
});


//////////////////////////////
module.factory("tecDadosBusca", function(tec, paramService) {
	var service = {
		questoes: null,
		usuarioGratis: !$.isAssinanteLogado(),
		buscarQuestoesPorEnunciado: buscarQuestoesPorEnunciado,
		buscarQuestoes: buscarQuestoes,
		salvarCookie: salvarCookie,
		atualizarPesquisa: atualizarPesquisa,
		existePesquisaSalva: existePesquisaSalva,
		cookieName: "busca-por-enunciado-usuario-" + jsonUsuario,
		alterarQuestao: alterarQuestao
	};
	return service;

	function buscarQuestoes(enunciado, pagina) {
		var pagina = !pagina ? 1 : pagina;

		return tec.apiPost("/questoes", { enunciado: enunciado, pagina: pagina });
	}
	
	function buscarQuestoesPorEnunciado(enunciado, idQuestao, scope) {
		return tec.apiPost("/questoes", { enunciado: enunciado })
		.then(function(data) {
			service.questoes = data.questoes;
			if(idQuestao != null && scope != null) {
				var index = buscarIndiceQuestao(idQuestao);
				scope.indiceQuestaoAtual = index;
			}
		});
	}
	
	function buscarIndiceQuestao(idQuestao) {
		var array = service.questoes;
		var indice = 0;
		$.each(array, function(index, value) {
			if(value == idQuestao) {
				indice = index;
			}
		});
		return indice;
	}
	
	function salvarCookie(idQuestao) {
		var busca = $("#busca").val();
		localStorage.setItem(service.cookieName + "["+userId+"]", JSON.stringify({busca: busca, questao: idQuestao, data: new Date()}));
	}
	
	function atualizarPesquisa(scope, vm) {
		var pesquisa = getPesquisa();
		if(pesquisa != null && pesquisa.busca != null && pesquisa.busca != "") {
			vm.enunciado = pesquisa.busca;
			buscarQuestoesPorEnunciado(pesquisa.busca, pesquisa.questao, scope);
		}
	}
	
	function existePesquisaSalva() {
		var pesquisa = getPesquisa();
		return pesquisa != null && pesquisa.busca != null && pesquisa.busca != "";
	}
	
	function getPesquisa() {
		var pesquisaJson = localStorage.getItem(service.cookieName + "["+userId+"]");

		if (!pesquisaJson) {
			return null;
		}

		var pesquisa = JSON.parse(pesquisaJson)
        var data = pesquisa["data"];

		var expirado = !data || new Date().getTime() - new Date(data).getTime() > 7 * 24 * 60 * 60 * 1000 // 7 dias

		if (expirado) {
			localStorage.removeItem(service.cookieName + "["+userId+"]");
			return null;
		}

		return pesquisa;
	}
	
	function alterarQuestao(questao) {
		var json = paramService.toJson();
		var url = contextPathUrl + "questoes/busca/!" + json.enunciado + "/" + questao;
		location.href = url;
	}
});

module.directive("idQuestao", function (tecDadosBusca) {
	return {
		restrict: "A",
		
		link: function (scope, element, attrs) {
			scope.$watch(attrs.ngModel, function(value, old) {
				tecDadosBusca.salvarCookie(value);
			}, true);
		}
	};
});

module.service("paramService", function($route) {
	var service = {
		toJson: toJson,
		params: params,
		isParams: isParams
	};
	return service;
	
	function toJson() {
		return $route.current.params;
	}
	
	function params() {
		var queryString = atob($route.current.params.filtros);
		return queryString;
	}
	
	function isParams() {
		var params = toJson();
		var exist = false;
		if(params != null) {
			exist = true;
		}
		return exist;
	}
});

})();
