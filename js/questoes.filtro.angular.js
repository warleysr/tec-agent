(function() {

var module = angular.module("tec.questoes-filtro", [ "ngRoute", "tec.common", "tec.questao", "chart.js", "tec.gerador", "tec.questao-teoria", "tec.caderno" ]);


module.controller("QuestoesFiltroCtrl", function($rootScope, $location, $scope, $timeout, quetoesFiltroService) {
	var vm = this;
	vm.questoes = [];
	vm.mostrarFiltros = mostrarFiltros;
	vm.esconderQuestoes = esconderQuestoes;
	vm.exibirFiltros = false;
	vm.filtros = {};
	vm.filtrosForcados = [];
	vm.alterarFiltros = alterarFiltros;
	vm.isFiltroQuestoes = true;
	vm.buscarQuestoes = buscarQuestoes;
	vm.caderno = {};
	vm.carregamentoInicial = true;
	vm.questoesTmp = [];
	vm.quantidadePorPagina = 100;
	vm.controle = false;
	vm.filtrosTmp = {};
	vm.disabledMostrarFiltros = true;
	vm.contador = 0;
	
	vm.pageSize = jsonPageSize;
	vm.pagina = 1;
	vm.questaoSeguinte = null;
	vm.questaoAnterior = null;
	vm.abrirQuestaoPorNumero = null;
	vm.mostrarAlertaExclusivoParaAssinantes = mostrarAlertaExclusivoParaAssinantes;
	
	// esconder o gerador causa muito atraso no carregamento da tela. Alterado para sempre ser false.
	vm.esconderGerador = false;
	vm.mostrarRecolher = true;

	// No layout mobile a criação é feita em segundo momento
	// Usando o valor do $screen-sm-min
	vm.mostrarGerarCaderno = window.matchMedia("(min-width: 768px)").matches;
	vm.mostrandoQuestoesMobile = false;
	vm.abrirSoGerarCaderno = false;
	vm.abrirQuestoesMobile = abrirQuestoesMobile;
	vm.voltarParaFiltros = voltarParaFiltros;
	vm.abrirCriarCaderno = abrirCriarCaderno;
	vm.cancelarCriarCaderno = cancelarCriarCaderno;

	ativar();
	
	function ativar() {
		vm.caderno = {
			idCaderno: 0,
			cadernoHash: null
		};

		$scope.$watch("vm.exibirFiltros", function() {
			if(!vm.exibirFiltros && !vm.isFiltroQuestoes) {
				vm.isFiltroQuestoes = true;
				vm.questoes = inicializarArrayComNull(jsonTotalQuestoesObjetivas);
			}
		});
		
		$scope.$watchCollection("vm.questoes", function() {
			if(!vm.controle && verificarQuestoes()) {
				vm.disabledMostrarFiltros = false;
			}
			
		});
		
		$scope.$watch("vm.controle", function() {
			if(vm.controle) {
				if(angular.equals(vm.filtros, {})) {
					$(".questao").hide();
				}
			} else {
				if(!angular.equals(vm.filtros, {}) && vm.contador > 0) {
					$(".filtros-ativos").show();
				} else {
					$(".filtros-ativos").hide();
					if(vm.exibirFiltros) {
						vm.exibirFiltros = false;
						resetBuscarQuestoes();						
					}
				}
			}
		});
		
		carregarFiltrosListaFiltrosForcados();
		var possuiFiltros = quetoesFiltroService.possuiFiltrosCarregados();
		if(possuiFiltros) {
			vm.mostrarRecolher = true;
			vm.isFiltroQuestoes = false;
			vm.esconderGerador = false;
		} else {
			vm.mostrarRecolher = false;
			vm.isFiltroQuestoes = true;
			vm.disabledMostrarFiltros = false;
			vm.questoes = inicializarArrayComNull(jsonTotalQuestoesObjetivas);
		}

		vm.exibirFiltros = true;
		vm.controle = true;
		$("#questoes-filtro").toggle();
	}
	
	function inicializarArrayComNull(tamanho) {
		var array = new Array(tamanho);
		for(i=0; i < array.length; i++) {
			array[i] = null;
		}
		return array;
	}
	
	function buscarQuestoes(quantidade, pagina) {
		return quetoesFiltroService.buscarQuestoes(quantidade, pagina);
	}
	
	// este método é chamado pelo tec-gerador
	function alterarFiltros(filtros) {
		if(Array.isArray(filtros.filtros.FILTRO_QUESTAO)) {
			filtros.filtros = {};
		}
		
		var exibirGerador = $(".gerador").is(":visible");
		
		var contagem = $(".gerador-filtrador-cabecalho-titulo");
		var contagemValor = $(contagem.find("strong")[0]);
		vm.contador = contagemValor.html();

		if(vm.exibirFiltros && existeFiltros(filtros)) {
			vm.filtros = filtros;

			// No layout mobile as questões tem que ser carregadas manualmente
			// Usando o valor do $screen-sm-min
			if (window.matchMedia("(min-width: 768px)").matches) {
				vm.mostrarRecolher = true;
				carregarQuestoes();
			}
		} else if(!existeFiltros(filtros) && exibirGerador) {
			filtros.filtros = {};
			vm.filtros = {};

			resetarQuestoes();
		}
		
		vm.carregamentoInicial = false;
	}

	function carregarQuestoes() {
		alterarMetodosDeNavegacao(questaoSeguinte, questaoAnterior, abrirQuestaoPorNumero);

		quetoesFiltroService.atualizarFiltros(vm.filtros);
		quetoesFiltroService.buscarQuestoesPorFiltros()
			.then(function(data) {
				$(".questao").show();
				vm.isFiltroQuestoes = false;
				vm.pagina = 1;

				iniciarArrayDeQuestoes(data.questoes, vm.filtros.numeroQuestoesEncontradas);

				if(vm.questoes.length === 0) {
					$(".mensagem-filtros-selecionados-sem-questoes").show();
					$(".questao").hide();
				} else {
					$(".mensagem-filtros-selecionados-sem-questoes").hide();
				}

				if(vm.esconderGerador) {
					vm.mostrarFiltros();
					vm.esconderGerador = false;
				}

			});
	}

	function resetarQuestoes() {
		vm.questoes = [];
		$(".questao").hide();
		vm.mostrarRecolher = false;
		alterarMetodosDeNavegacao(null, null, null);
	}
		
	function possuiAlteracaoDeUniversoOuFormato(filtros) {
		var existeMudanca = !angular.equals(vm.filtros, {}) && (vm.filtros.formato.id != filtros.formato.id || vm.filtros.universo.id != filtros.universo.id);
		return existeMudanca;
	}
	
	function existeFiltros(object) {
		var filtros = object.filtros;
		return !angular.equals(filtros, {});
	}
	
	function carregarFiltrosListaFiltrosForcados() {
		vm.filtrosForcados.push("favoritas");
	}
	
	function mostrarFiltros() {
		vm.exibirFiltros = true;
		if (vm.controle) { // fechando o gerador
			$(".gerador").toggle("blind", {}, 800);
            $("#questoes-filtro").toggle();
		} else { // abrindo o gerador
            $("#questoes-filtro").toggle();
			$(".gerador").toggle("blind", {}, 800);
		}
		vm.controle = !vm.controle;
	}

	function mostrarFiltrosMobile() {
		vm.exibirFiltros = true;
		$(".gerador").toggle();
		$("#questoes-filtro").toggle();
		vm.controle = !vm.controle;
	}

	function esconderQuestoes(config) {
		if (config.abriu) {
			$("#container-questoes").hide();
			vm.mostrarRecolher = false;
		} else {
			$("#container-questoes").show();
			vm.mostrarRecolher = true;
		}
	}

	function abrirQuestoesMobile() {
		vm.mostrandoQuestoesMobile = true;
		mostrarFiltrosMobile();
		carregarQuestoes();
		$(".questoes-filtro-conteudo")[0].scrollIntoView({
			behavior: 'smooth'
		});
	}

	function voltarParaFiltros() {
		vm.mostrandoQuestoesMobile = false;
		if (vm.mostrarGerarCaderno) {
			$(".gerador").toggle();
			vm.mostrarGerarCaderno = false;
		}
		mostrarFiltrosMobile();
		resetarQuestoes();
	}

	function abrirCriarCaderno() {
		vm.mostrarGerarCaderno = true;

		$(".gerador").toggle();
	}

	function cancelarCriarCaderno() {
		vm.mostrarGerarCaderno = false;

		$(".gerador").toggle();
	}
	
	function verificarQuestoes() {
		return vm.questoes.length && vm.questoes[0] != null;
	}
	
	function resetBuscarQuestoes() {
		quetoesFiltroService.buscarQuestoes(vm.quantidadePorPagina, 1).then(function(data) {
			vm.isFiltroQuestoes = false;
			vm.pagina = 1;

			var arrayTmp = inicializarArrayComNull(jsonTotalQuestoesObjetivas);
			for(var i=0; i<data.questoes.length; i++) {
				arrayTmp[i] = data.questoes[i];
			}
			$(".questao").show();
			vm.questoes = arrayTmp;
			arrayTmp = null;
		});
	}
	
	function iniciarArrayDeQuestoes(questoes, quantidade) {
		var inicio = (vm.pagina - 1) * vm.pageSize;
		var fim = vm.pageSize;
		if(quantidade < vm.pageSize) {
			fim = quantidade;
		}
		
		vm.questoes = new Array(quantidade);
		for(var i = 0; i < vm.questoes.length; i++) {
			if(i < questoes.length) {
				vm.questoes[i] = questoes[i];
				inicio++;
			} else {
				vm.questoes[i] = null;
			}
		}
		
		vm.posicaoAtual = inicio;
	}
	
	function adicionarQuestoes(questoes, pagina) {
		var inicio = buscarIndiceInicialPorPagina(pagina);
		for(var i = 0; i < questoes.length; i++) {
			vm.questoes[inicio] = questoes[i];
			inicio++;
		}
		vm.posicaoAtual = inicio;
	}
	
	function alterarMetodosDeNavegacao(callbackQuestaoSeguinte, callbackQuestaoAnterior, callbackAbrirQuestaoPorNumero) {
		vm.questaoSeguinte = callbackQuestaoSeguinte;
		vm.questaoAnterior = callbackQuestaoAnterior;
		vm.abrirQuestaoPorNumero = callbackAbrirQuestaoPorNumero;
	}
	
	function questaoSeguinte(indiceQuestaoAtual, callbackAbrirQuestaoDeslogado) {
		if((vm.questoes[indiceQuestaoAtual] == null) && (vm.posicaoAtual) == indiceQuestaoAtual) {
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
		var pagina = buscarPaginaPorIndice(indiceQuestaoAtual);
		
		vm.pagina = pagina;
		vm.filtros["pagina"] = pagina;
		quetoesFiltroService.atualizarFiltros(vm.filtros);
		
		quetoesFiltroService.buscarQuestoesPorFiltros()
		.then(function(data) {
			adicionarQuestoes(data.questoes, pagina);
			callbackAbrirQuestaoDeslogado(indiceQuestaoAtual);
		});
	}
	
	function buscarPaginaPorIndice(indiceQuestaoAtual) {
		var pagina = Math.floor((indiceQuestaoAtual / vm.pageSize) + 1);
		return pagina;
	}
	
	function buscarIndiceInicialPorPagina(pagina) {
		var indiceFinal = (pagina * vm.pageSize) - 1;
		var indiceInicial = (indiceFinal - vm.pageSize) + 1;
		return indiceInicial;
	}
	
	function buscarIndiceFinalPorPagina(pagina) {
		var indiceFinal = (pagina * vm.pageSize) - 1;
		return indiceFinal;
	}

	function mostrarAlertaExclusivoParaAssinantes() {
		$.alerts.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	}
});



module.service("quetoesFiltroService", function($route, tec) {
	var service = {
		buscarQuestoes: buscarQuestoes,
		buscarQuestoesPorFiltros: buscarQuestoesPorFiltros,
		atualizarFiltros: atualizarFiltros,
		possuiFiltrosCarregados: possuiFiltrosCarregados,
		hash: hash
	};
	
	return service;
	var filtros = {};
	
	function buscarQuestoesPorFiltros() {
		var parametros = filtrosParaParametros(this.filtros);
		return tec.apiPost("/questoes/filtros", parametros)
		.then(function(data) {
			if (data.erro) {
				tec.alert(data.erro.mensagem, 'Erro ao buscar questões');
				return { questoes: [] };
			}

			return data;
		});
	}
	
	function buscarProximaQuestao() {
		
	}
	
	function hash(questoes) {
		var index = 0;
		var ids = [];
		for(var i=0; i<questoes.length; i++) {
			if (typeof questoes[i] != null) {
				ids[index] = parseFloat(questoes[i]);
				index++;
			}
		}
		
		return tec.apiPost("/questoes/filtros/hash", {ids: ids})
		.then(function(data) {
			return data;
		});
		
	}
	
	function atualizarFiltros(filtros) {
		this.filtros = filtros;
	}
	
	function possuiFiltrosCarregados() {
		return jsonFiltrosGeracao != null;
	}
	
	function buscarQuestoes(quantidade, pagina) {
		var parametros = {
				"formatos[0]": "OBJETIVA",
				//"formatos[1]": "DISCURSIVA",
				"status[0]": "AGUARDANDO_COMENTARIO",
				"status[1]": "AGUARDANDO_PUBLICACAO",
				"status[2]": "PUBLICADA",
				"quantidade": quantidade,
				"pagina": pagina
		};
		return tec.apiPost("/questoes/filtros/paginacao", parametros);
	}
	
	//private functions
	
	function filtrosParaParametros(object) {
		var filtros = object.filtros;
		var formato = object.formato.id;
		var universo = object.universo.id;
		var pagina = object.pagina;
		
		var parametros = {
				"formato": formato,
				"universo": universo,
				"pagina": pagina 
		};
		
		var index = 0;
		angular.forEach(filtros, function(listaFiltros) {
			angular.forEach(listaFiltros, function(object) {
				parametros["filtros[" + index + "].id"] = object.id;
				parametros["filtros[" + index +"].tipo"] = object.tipo;
				index++;
			});
		});
		
		return parametros;
	}
});


})();
