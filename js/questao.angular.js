(function() {

var module = angular.module("tec.questao", [ "chart.js", "tec.componentes"]);

module.directive("tecQuestaoNaoLogado", ["tecQuestaoEmbed", function(tecQuestaoEmbed) {
	return {
		restrict: "A",
		scope: {
			config: "=tecQuestaoNaoLogado"
		},
		templateUrl: "questao-directive",
		controller: "TecQuestaoCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			scope.$watch("config", function() {
				ctrl.inicializarQuestaoNaoLogado(scope.config);
			});
			scope.$on("$destroy", function() {
				tecQuestaoEmbed.unmount(ctrl);
			});
		},
	};
}]);


module.directive("tecQuestaoConteudoPesquisa", ["tecQuestaoEmbed", function(tecQuestaoEmbed) {
	return {
		restrict: "A",
		scope: {
			config: "=tecQuestaoConteudoPesquisa"
		},
		templateUrl: "questao-directive",
		controller: "TecQuestaoCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			scope.$watch("config", function() {
				ctrl.inicializarQuestaoConteudoPesquisa(scope.config);
			});
			scope.$on("$destroy", function() {
				tecQuestaoEmbed.unmount(ctrl);
			});
		},
	};
}]);


// ativa para elementos com atributo "tec-questao" (tecQuestao --> tec-questao)
module.directive("tecQuestao", ["tecQuestaoEmbed", function(tecQuestaoEmbed) {
	return {
		restrict: "A",
		scope: {
			config: "=tecQuestao"
		},
		templateUrl: "questao-directive",
		controller: "TecQuestaoCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			scope.$watch("config", function() {
				ctrl.inicializarQuestao(scope.config);
			});
			scope.$on("$destroy", function() {
				tecQuestaoEmbed.unmount(ctrl);
			});
		},
	};
}]);

module.directive("tecQuestaoCaderno", ["tecQuestaoEmbed", function(tecQuestaoEmbed) {
	return {
		restrict: "A",
		scope: {
			caderno: "=tecQuestaoCaderno",
			mostrarAcertosEErros: "=mostrarAcertosEErros",
			relogio: "=",
			capituloAberto: "="
		},
		templateUrl: "questao-directive",
		controller: "TecQuestaoCadernoCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			ctrl.inicializarQuestao(scope.caderno, scope.relogio, scope.capituloAberto, scope.mostrarAcertosEErros);
			scope.$on("$destroy", function() {
				tecQuestaoEmbed.unmount(ctrl);
			});
		},
	};
}]);

module.directive("tecQuestaoCadernoAberto", ["tecQuestaoEmbed", function(tecQuestaoEmbed) {
	return {
		restrict: "A",
		scope: {
			config: "=tecQuestaoCadernoAberto",
		},
		templateUrl: "questao-directive",
		controller: "TecQuestaoCadernoAbertoCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			scope.$watch("config", function() {
				ctrl.inicializarQuestao(scope.config)
			});
			scope.$on("$destroy", function() {
				tecQuestaoEmbed.unmount(ctrl);
			});
		},
	};
}]);

module.directive("tecQuestaoModulo", ["tecQuestaoEmbed", function(tecQuestaoEmbed) {
	return {
		restrict: "A",
		scope: {
			questaoModulo: "=tecQuestaoModulo",
		},
		templateUrl: "questao-directive",
		controller: "TecQuestaoModuloCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			scope.$watch("questaoModulo", function() {
				ctrl.inicializarQuestao(scope.questaoModulo, scope.resolverQuestaoCallback);
			});
			scope.$on("$destroy", function() {
				tecQuestaoEmbed.unmount(ctrl);
			});
		},
	};
}]);

// se mudar a assinatura, mudar nos outros controllers tambem
function TecQuestaoCtrl($scope, $timeout, $location, $sce, tec, tecDadosQuestao, tecQuestaoEmbed) {
	var vm = this;
	vm.pastasFavoritas = null;
	vm.inicializarQuestao = inicializarQuestao;
	vm.inicializarQuestaoNaoLogado = inicializarQuestaoNaoLogado;
	vm.inicializarQuestaoConteudoPesquisa = inicializarQuestaoConteudoPesquisa;
	vm.callbackCarregarQuestao = callbackCarregarQuestao;
	vm.callbackCarregarQuestaoSemScroll = callbackCarregarQuestaoSemScroll;
	vm.questaoAnterior = questaoAnterior;
	vm.questaoSeguinte = questaoSeguinte;
	vm.abrirQuestaoPorNumero = abrirQuestaoPorNumero;
	vm.numeroQuestaoExibicao = numeroQuestaoExibicao;
	vm.nomeAssuntoExibicao = nomeAssuntoExibicao;
	vm.buscarConcursoQuestao = buscarConcursoQuestao;
	vm.selecionarAlternativa = selecionarAlternativa;
	vm.mostrarTextoAssociado = mostrarTextoAssociado;
	vm.resolverQuestao = resolverQuestao;
	vm.resolverQuestaoIneditaOuAdaptada = resolverQuestaoIneditaOuAdaptada;
	vm.alertaResolverQuestaoIneditaOuAdaptada = alertaResolverQuestaoIneditaOuAdaptada;
	vm.verificarResolucao = verificarResolucao;
	vm.verificarAlternativaGabarito = verificarAlternativaGabarito;
	vm.verificarAlternativaErro = verificarAlternativaErro;
	vm.verificarAlternativaSemMarcacao = verificarAlternativaSemMarcacao;
	vm.abrirComplemento = abrirComplemento;
	vm.fecharComplemento = fecharComplemento;
	vm.descricaoComplementoAtivo = descricaoComplementoAtivo;
	vm.scrollSeNecessario = scrollSeNecessario;
	vm.scrollParaComplementos = scrollParaComplementos;
	vm.exibirFavorita = exibirFavorita;
	vm.ocultarFavorita = ocultarFavorita;
	vm.exibirAnotacao = exibirAnotacao;
	vm.ocultarAnotacao = ocultarAnotacao;
	vm.salvarFavorita = salvarFavorita;
	vm.mostrarModalFavorita = mostrarModalFavorita;
	vm.ativarCriarPastaFavorita = ativarCriarPastaFavorita;
	vm.cancelarCriarPastaFavorita = cancelarCriarPastaFavorita;
	vm.editarAnotacao = editarAnotacao;
	vm.salvarAnotacao = salvarAnotacao;
	vm.exibirBotaoSalvar = exibirBotaoSalvar;
	vm.removerAnotacao = removerAnotacao;
	vm.removerFavorita = removerFavorita;
	vm.notificarAlteracaoAnotacao = notificarAlteracaoAnotacao;
	vm.exibirAssunto = null;
	vm.alternarExibirAssunto = alternarExibirAssunto;
	vm.exibirConcurso = null;
    vm.alternarExibirConcurso = alternarExibirConcurso;
	vm.abrirFormularioErro = abrirFormularioErro;
	vm.enviarFormularioErro = enviarFormularioErro;
	vm.zerarFormularioNotificacao = zerarFormularioNotificacao;
	vm.deslogado = false;
	config = null;
	vm.token = null;
	vm.dataPublicacaoFormatada = dataPublicacaoFormatada;
	vm.exibirResolucao = null;
	vm.alternarExibirResolucao = alternarExibirResolucao;
	vm.resolucaoAcertos = resolucaoAcertos;
	vm.resolucaoErros = resolucaoErros;
	vm.resolucaoTotal = resolucaoTotal;
	vm.capituloAberto = {}; // recebe da diretiva (para sincronizar o tempo de
							// acesso dentro do caderno)
	vm.riscarAlternativa = riscarAlternativa;
	vm.limparAlternativasRiscadas = limparAlternativasRiscadas;
	vm.erroQuestaoTipo = {};
	vm.erroQuestaoSubTipo = {};
	vm.abrirQuestaoDeslogado = abrirQuestaoDeslogado;
	vm.getTextoDoComplementoAberto = getTextoDoComplementoAberto;
	carregarErroQuestaoJson();
	vm.alternativasME = ["A", "B", "C", "D", "E"];
	vm.buscarDescricaoDaAlternativa = buscarDescricaoDaAlternativa;
	vm.postMessageComResolucaoQuestao = postMessageComResolucaoQuestao;
	vm.isAlternativaSelecionada = isAlternativaSelecionada;
	vm.getAlternativa = getAlternativa;
	vm.funcaoDummyClicavelNvda = function(){};
	vm.celebracaoAleatoria = "";
	vm.urlRetornoLogin = null;
	vm.manterResolucao = false;
	vm.modoExibicaoComentario = { codigo: "ACIMA", descricao: "Acima", icone: "acima"}; // default
	vm.alterarModoExibicaoComentarioAbaixo = alterarModoExibicaoComentarioAbaixo;
	vm.alterarModoExibicaoComentarioAcima = alterarModoExibicaoComentarioAcima;
	vm.alterarModoExibicaoComentarioAoLado = alterarModoExibicaoComentarioAoLado;
	vm.modoExibicaoForum = { codigo: "ACIMA", descricao: "Acima", icone: "acima"}; // default
	vm.alterarModoExibicaoForumAbaixo = alterarModoExibicaoForumAbaixo;
	vm.alterarModoExibicaoForumAcima = alterarModoExibicaoForumAcima;
	vm.alterarModoExibicaoForumAoLado = alterarModoExibicaoForumAoLado;
	vm.estaNoApp = estaNoApp;
	vm.isMobile = tec.isMobile();
	
	vm.aguardandoResolucao = false;

	vm.tipoComentario = {
		TEXTO: "texto",
		VIDEO: "video",
		IA: "ia"
	};
	vm.tipoComentarioAtivo = null;
	vm.toggleTipoComentario = toggleTipoComentario;
	vm.telaDesktop = window.screen.width > 1200;

	vm.mostrarRemoverQuestao = mostrarRemoverQuestao;
    vm.removerQuestao = removerQuestao;
	vm.adicionarQuestaoDeUmCadernoAOutro = adicionarQuestaoDeUmCadernoAOutro;
	vm.adicionarQuestaoACaderno = adicionarQuestaoACaderno;
	vm.enviarQuestaoACaderno = enviarQuestaoACaderno;
    vm.adicionarQuestaoEntreCadernos = adicionarQuestaoEntreCadernos;
    vm.toggleTextoAssociado = toggleTextoAssociado;

	vm.modalAdicionarQuestaoValues = {
		pasta: null,
		subpasta: null,
		caderno: null,
	};

	function toggleTipoComentario(tipo) {
		if (tipo === vm.tipoComentario.VIDEO && !$.isAssinanteAvancadoLogado()) {
			mostrarAlertaExclusivoParaAssinanteAvancado();
			return;
		}

		vm.tipoComentarioAtivo = tipo;
	}

	function inicializarQuestaoNaoLogado(config) {
		vm.config = config;
		vm.token = config.token;
		
		vm.deslogado = true;
		vm.questoes = config.questoes;
		vm.usuarioGratis = config.usuarioGratis;
		vm.indiceQuestaoAtual = 0;
		if(config.indiceQuestaoAtual) {
			vm.indiceQuestaoAtual = config.indiceQuestaoAtual;
		}
		var id = vm.questoes[vm.indiceQuestaoAtual];
		if (config.questoes.length > 1) {
			vm.navegacao = true;
		}

		return abrirQuestao(true);
	}
	
	function carregarErroQuestaoJson() {
		// tem casos que não vai existir a variável jsonErroQuestaoTipo, por
		// isso o try/catch
		try {
			if (jsonErroQuestaoTipo) {
				vm.erroQuestaoTipo = jsonErroQuestaoTipo;
			}
		} catch (e) {
			vm.erroQuestaoTipo = {};
		}

		try {
			if (jsonErroQuestaoSubTipo) {
				vm.erroQuestaoSubTipo = jsonErroQuestaoSubTipo;
			}
		} catch (e) {
			vm.erroQuestaoSubTipo = {};
		}
	}
	
	function inicializarQuestaoConteudoPesquisa(config) {
		vm.token = config.token;
		vm.navegacao = true;
		vm.ocultarNavegacao = config.ocultarNavegacao;
		inicializarQuestao(config)
		.then(function() {
			if ($('#abrirDiscussao').val()) {
				vm.abrirComplemento('discussao');
			}
		});
	}

	function inicializarQuestao(config, capituloAberto) {
		vm.config = config;
		var pastaAtualConfig = vm.config.pastaAtual == null ? 0 : config.pastaAtual;
		
		vm.telaDesktop = window.screen.width > 1200;

		if (vm.pastaAtual != pastaAtualConfig) {
			resetSessao(pastaAtualConfig);
		}

		vm.pastaAtual = pastaAtualConfig;
		vm.manterResolucao = config.manterResolucao;
		vm.questoes = config.questoes;
		vm.usuarioGratis = config.usuarioGratis;
		vm.indiceQuestaoAtual = 0;
		
		if(config.indiceQuestaoAtual) {
			vm.indiceQuestaoAtual = config.indiceQuestaoAtual;
		}
		if (!capituloAberto) {
			vm.capituloAberto = {};
		} else {
			vm.capituloAberto = capituloAberto;
		}
		
		var id = vm.questoes[vm.indiceQuestaoAtual];
		if (config.questoes.length > 1) {
			vm.navegacao = true;
		}

		var promiseConfig;
		if (!vm.configuracoesUsuario) {
			promiseConfig = tecDadosQuestao.carregarConfiguracoesDoAluno().then(function(dados){
				vm.configuracoesUsuario = dados;

				if (!vm.configuracoesUsuario.hasOwnProperty("mostrarNumeroComentarioForum")) {
					vm.configuracoesUsuario["mostrarNumeroComentarioForum"] = true;
				}
			});
		} else {
			promiseConfig = Promise.resolve();
		}

		var promiseQuestao;
		if (typeof jsonQuestaoPreCarregada !== 'undefined' && jsonQuestaoPreCarregada) {
        	promiseQuestao = Promise.resolve(callbackCarregarQuestao({questao: jsonQuestaoPreCarregada}));
		} else {
			promiseQuestao = abrirQuestao();
		}

		return Promise.all([promiseConfig, promiseQuestao]);
	}
	
	function abrirQuestao(deslogado) {
		if (vm.indiceQuestaoAtual < 0) {
			vm.indiceQuestaoAtual = 0;
		}
		if (vm.indiceQuestaoAtual >= vm.questoes.length) {
			vm.indiceQuestaoAtual = vm.questoes.length - 1;
		}

		var id = vm.questoes[vm.indiceQuestaoAtual];

		if(deslogado) {
			if (!id) {
				return;
			}
			return tecDadosQuestao.carregarQuestaoDeslogado(id)
			.then(vm.callbackCarregarQuestao)
			.then(callbackCadernoAberto)
			.then(function() {
				if (vm.inicializarSwipeQuestoes) {
					vm.inicializarSwipeQuestoes();
				}
			})
			.catch(function(erro) {
				console.log("Erro: " + erro);
			});
		}
		
		return tecDadosQuestao.carregarQuestao(id)
		.then(vm.callbackCarregarQuestao)
		.then(callbackResolucaoSemCaderno)
		.then(function() {
			if (vm.inicializarSwipeQuestoes) {
				vm.inicializarSwipeQuestoes();
			}
		});
	}
	
	function estaNoApp() {
		return $.isApp();
	}

	function callbackResolucaoSemCaderno() {
		var sessao = getSessao(vm.pastaAtual);
		var idQuestao = vm.questoes[vm.indiceQuestaoAtual];

		if (sessao.questoes) {
			var dadosQuestao = sessao.questoes[idQuestao];
			if (dadosQuestao) {
				vm.questao.numeroAlternativaCorreta = dadosQuestao.correta;
				vm.questao.alternativaSelecionada = dadosQuestao.selecionada;
				vm.questao.correcaoQuestao = dadosQuestao.acertou;
			}
		}
	}
	
	function callbackCadernoAberto() {
		if (vm.caderno && vm.caderno.getSessao) {
			var sessao = vm.caderno.getSessao(vm.caderno.idCaderno);
			var idQuestao = vm.questoes[vm.indiceQuestaoAtual];

			if (sessao.questoes) {
				var dadosQuestao = sessao.questoes[idQuestao];
				if (dadosQuestao) {
					vm.questao.numeroAlternativaCorreta = dadosQuestao.correta;
					vm.questao.alternativaSelecionada = dadosQuestao.selecionada;
					vm.questao.correcaoQuestao = dadosQuestao.acertou;
				}
			}
		}
	}
	
	function abrirQuestaoDeslogado(numeroQuestao) {
		vm.indiceQuestaoAtual = numeroQuestao;
		abrirQuestao(true);
	}

	function callbackCarregarQuestao(data, impedirScroll) {
		$scope.$evalAsync(function() {
			tec.habilitarSelecao();
			if (!data || !data.questao) {
				return;
			}

			vm.questao = data.questao;
			vm.questao.alternativasClicadas = [0, 0, 0, 0, 0];
			if (!vm.questao) {
				return null;
			}

			if (vm.questao.alternativaSelecionada == null) {
               	tecDadosQuestao.relogio.iniciar();
			} else {
				tecDadosQuestao.relogio.parar();
			}

			vm.carregrQuestaoAcabou = true;

			if(vm.token != null) {
				vm.questao.possuiComentario = true;
			}

			//definir qual comentário vem aberto:
			vm.tipoComentarioAtivo = 
			    (vm.questao.possuiComentario && vm.tipoComentario.TEXTO) || 
			    (($.isAssinanteAvancadoLogado() && vm.questao.possuiComentarioVideo) && vm.tipoComentario.VIDEO) ||
			    (vm.questao.possuiComentarioIA && vm.tipoComentario.IA) || 
			    vm.tipoComentario.TEXTO;

			vm.celebracaoAleatoria = gerarCelebracaoAleatoria();
			vm.questao.temAnotacao = vm.questao.anotacao && vm.questao.anotacao.length;

			if (vm.favoritarKeydown !== true) {
				$(document).on("keydown", function(e) {
					var elementoAtivo = e.currentTarget.activeElement;
					var elementoTexto = elementoAtivo.contentEditable != 'true' && (typeof elementoAtivo.type === 'undefined' || elementoAtivo.type.substring(0,4) != 'text');
					var modifier = e.ctrlKey || e.shiftKey || e.metaKey || e.altKey;
					if (!modifier && e.keyCode === 74 && elementoTexto) {
						if ($.isAssinanteLogado()) {
							if (vm.questao.favorita) {
								vm.removerFavorita(true);
							} else {
								vm.salvarFavorita(true);
							}
						} else {
							mostrarAlertaExclusivoParaAssinantes();	
						}
					}
				});
				vm.favoritarKeydown = true;
			}

			$timeout(function() {
				mostrarTextoAssociado();

				if (!impedirScroll) {
					vm.scrollSeNecessario();
				}
				
				$(window).scroll();
				vm.zerarFormularioNotificacao();
				tecQuestaoEmbed.syncAfterQuestaoLoad(vm);
			});
		});
	}
	
	function possuiToken() {
		if(vm.token != null) {
			return true;
		}
		return false;
	}
	
	function callbackCarregarQuestaoSemScroll(data) {
		callbackCarregarQuestao(data, true);
	}
	
	function questaoAnterior() {
		if (vm.indiceQuestaoAtual <= 0) {
			vm.indiceQuestaoAtual = vm.questoes.length - 1;
		} else {
			vm.indiceQuestaoAtual--;			
		}

		if(vm.config && vm.config.callbackQuestaoAnterior) {
			var id = vm.questoes[vm.indiceQuestaoAtual];
			vm.config.callbackQuestaoAnterior(id);
		}
		abrirQuestao(vm.deslogado);
	}
	
	function questaoSeguinte() {
		if (vm.indiceQuestaoAtual >= vm.questoes.length - 1) {
			vm.indiceQuestaoAtual = 0;
		} else {			
			vm.indiceQuestaoAtual++;
		}

		if(vm.config && vm.config.callbackQuestaoSeguinte) {
			var id = vm.questoes[vm.indiceQuestaoAtual];
			vm.config.callbackQuestaoSeguinte(id);
		}
		
		abrirQuestao(vm.deslogado);
	}
	
	function abrirQuestaoPorNumero() {
		var mensagem = "Deseja ver qual questão? (número entre 1 e " + (vm.questoes.length) + ")";
		tec.prompt(mensagem, vm.indiceQuestaoAtual + 1, "Acessar questão por número", function(result) {
			if (result != null) {
				var numeroQuestao = result.replace(/\D/g, "");
				if (numeroQuestao.length) {
					if (numeroQuestao > vm.questoes.length) {
						tec.alert("Posição informada extrapola o índice do caderno. Por favor, coloque um número válido.", "Ir para");
					} else {
						vm.indiceQuestaoAtual = parseInt(numeroQuestao) - 1;
						abrirQuestao(vm.deslogado);
					}
				}
			}
		});
	}
	
	function numeroQuestaoExibicao() {
		return (vm.indiceQuestaoAtual + 1) + " de " + vm.questoes.length;
	}
	
	function nomeAssuntoExibicao() {
		if (vm.questao && vm.questao.nomeAssunto && vm.questao.nomeAssunto.length) {
			return vm.questao.nomeAssunto; 
		}
		return "Sem classificação";
	}
	
	function buscarConcursoQuestao() {
		var dados = vm.questao;
		if (dados) {
			var concursoQuestao = dados.concursoAno + " - " + dados.cargoSigla;
			concursoQuestao += dados.concursoArea ? "/" + dados.concursoArea : "";
			concursoQuestao += dados.concursoEspecialidade ? "/" + dados.concursoEspecialidade : "";
			concursoQuestao += dados.concursoEdicao ? "/" + dados.concursoEdicao : "";
			if (dados.numeroConcursos > 0) {
				concursoQuestao += " (e mais " + dados.numeroConcursos + " concurso" + (dados.numeroConcursos > 1 ? "s" : "") + ")";
			}

			return concursoQuestao;
		}
	}
	
	function isAlternativaSelecionada(indice) {
		if (vm.questao.alternativaSelecionada) {
			return vm.questao.alternativaSelecionada - 1 == indice;
		}
		return false;
	}
	
	function getAlternativa(indice) {
		if (vm.questao.alternativas.length > 2) {
			return vm.alternativasME[indice];
		} else {
			if (indice == 0) {
				return "C";
			} else if (indice == 1) {
				return "E";
			}			
		}
		return;
	}
	
	function selecionarAlternativa(alternativa) {
		vm.atualizarAlternativa = true;
		var cliques = vm.questao.alternativasClicadas[alternativa];
		
		if (cliques > 0) {
			vm.questao.alternativasClicadas[alternativa] = ++cliques;
			// se for par
			if (Math.abs(cliques % 2) == 0) {
				vm.questao.alternativaSelecionada = null;
			}
			
		} else {
			// numero de clicks impar volta pra zero
			for (i = 0; i < 5; i++) {
				if (Math.abs(vm.questao.alternativasClicadas[i] % 2) != 0) {
					vm.questao.alternativasClicadas[i] = 0;
				}
			}
			vm.questao.alternativasClicadas[alternativa] = 1;
			vm.questao.alternativaSelecionada = alternativa + 1;
		}
	}

	function mostrarTextoAssociado() {
		var textoAssociadoLink = $(".link-textoassociado");

		textoAssociadoLink.on('click', function() {
			var mostrarTextoAssociado = textoAssociadoLink.hasClass("collapsed");
			$.atualizarConfiguracaoUsuarioLocalStorage("mostrarTextoAssociado" + "["+userId+"]", mostrarTextoAssociado);
		});

		$.obterValorConfiguracaoUsuario("mostrarTextoAssociado" + "["+userId+"]")
		.then(function(mostrar) {
			if(mostrar) {
				textoAssociadoLink.removeClass("collapsed");
				var textoAssociado = $(".textoassociado");
				textoAssociado.addClass("in");
			}
		});
	}

	function riscarAlternativa(indice) {
		return (vm.questao.alternativasClicadas[indice] > 0 && Math.abs(vm.questao.alternativasClicadas[indice] % 2) == 0 );
	}
	
	function limparAlternativasRiscadas() {
		for (i = 0; i < 5; i++) {
			vm.questao.alternativasClicadas[i] = 0;
		}
	}
	
	function exibirAlertaInvestidaCompleta() {
		var mostrar = localStorage.getItem("tec.exibirAnimacaoInvestida" + "["+userId+"]") === "true";
		if(mostrar) {
			confetti({
			  particleCount: 100,
			  spread: 70,
			  origin: { y: 0.6 }
			});				
		}


		Toastify({
		  text: "🎉 Parabéns, você completou a investida de hoje!",
		  duration: 3500,
		  gravity: "top", // `top` or `bottom`
		  position: "right", // `left`, `center` or `right`
		  stopOnFocus: true, // Prevents dismissing of toast on hover
		  className: "info"
		}).showToast();
	}
	
	function resolverQuestao() {
		var tempoRelogio = tecDadosQuestao.relogio.obterTempoEParar();

		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			questaoAdaptadaOuInedita: vm.questao.questaoAdaptadaOuInedita,
			tempoResolucao: tempoRelogio,
		};

		if(vm.questao.formatoQuestao == 'DISCURSIVA') {
			params.correcaoQuestao = true;
		}

		tecDadosQuestao.alterarQuestao(vm.questao.idQuestao, params)
		.then(vm.callbackCarregarQuestaoSemScroll)
		.then(function() {
			if (vm.questao.conquistouInvestida) {
				exibirAlertaInvestidaCompleta();
			}
		})
		.then(function() {
			if (vm.manterResolucao) {
				var sessao = getSessao(vm.pastaAtual);
				if (!sessao.questoes) {
					sessao.questoes = {};
				}
				sessao.questoes[vm.questao.idQuestao] = {
						selecionada: vm.questao.alternativaSelecionada,
						correta: vm.questao.numeroAlternativaCorreta,
						acertou: vm.questao.numeroAlternativaCorreta == vm.questao.alternativaSelecionada
				};

				setSessao(vm.pastaAtual, sessao);
			}

		})
		.then(limparAlternativasRiscadas)
		.catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}
		});
	}

	function resolverQuestaoIneditaOuAdaptada() {
		if(vm.questao.assinanteAvancado) {
			resolverQuestao();
		}
	}
	
	function alertaResolverQuestaoIneditaOuAdaptada() {
		tec.alert('Para resolver esta questão é necessário possuir o Plano Avançado.', 'Questão adaptada / inédita');
	}
	
	function verificarResolucao(alternativa) {
		if (vm.questao.correcaoQuestao != null) {
			if (alternativa == vm.questao.numeroAlternativaCorreta && vm.questao.numeroAlternativaCorreta == vm.questao.alternativaSelecionada) {
				return "acerto";
			} else if (alternativa == vm.questao.numeroAlternativaCorreta) {
				return "correcao";
			} else if (alternativa == vm.questao.alternativaSelecionada) {
				return "erro";
			}
		}
		return "";
	}
	
	function verificarAlternativaGabarito(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao == "acerto" || resolucao == "correcao";
	}
	
	function verificarAlternativaErro(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao == "erro";
	}
	
	function verificarAlternativaSemMarcacao(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao != "acerto" && resolucao != "correcao" && resolucao != "erro";
	}

	function mostrarAlertaExclusivoParaAssinantes() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	}
	function mostrarAlertaExclusivoParaAssinanteAvancado() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do Plano Avançado.", "Recurso exclusivo do Plano Avançado");
	}
	
	function gerarCelebracaoAleatoria() {
		var celebracoes = ["Parabéns!", "Muito bem!", "Continue assim!", "Mandou bem!", "Boa!"];
		return celebracoes[Math.floor(Math.random() * celebracoes.length)];
	}

	function abrirComplemento(complemento) {
		if (complemento == vm.questao.complemento) {
			fecharComplemento();
			return;
		}

		if (complemento == 'discussao' && vm.questao.questaoAdaptadaOuInedita && !$.isLogado()) {
			tec.alert("Fórum de discussão de questões inéditas está disponível para assinantes do Plano Avançado. <a href='"+contextPathUrl+"assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo do Plano Avançado");
			return;
		} else if (complemento == 'comentario'){
			if (!$.isAssinanteAvancadoLogado() && vm.questao.questaoAdaptadaOuInedita) {
				tec.alert("Comentário do professor de questões inéditas está disponível para assinantes do Plano Avançado. <a href='"+contextPathUrl+"assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo do Plano Avançado");
				return;
			}

			if (!vm.questao.possuiComentario || !vm.questao.possuiComentarioVideo || !vm.questao.possuiComentarioIA) {
				vm.ocultarFavorita();
				vm.ocultarAnotacao();
				if (vm.questao.complemento) {
					vm.questao.complemento = null;
				}

				tec.apiGet("/questoes/" + vm.questao.idQuestao + "/solicitacoes-comentario", {})
					.then(function(data) {
						vm.questao.solicitouComentarioTexto = data.solicitacoes.solicitouTexto;
						vm.questao.solicitouComentarioVideo = data.solicitacoes.solicitouVideo;
						vm.questao.solicitouComentarioIA = data.solicitacoes.solicitouIA;
						vm.questao.complemento = 'comentario';
						tec.desabilitarSelecao();
						tecQuestaoEmbed.syncComplemento(vm);
					});
				return;
			}
		} else if ((complemento == 'banca' || complemento == 'desempenho') && !$.isAssinanteLogado()) {
			mostrarAlertaExclusivoParaAssinantes();
			return;
		}

		// fecha menu favorita caso esteja aberto
		vm.ocultarFavorita();
		vm.ocultarAnotacao();
		// forçando o scope a chamar destroy nos elementos por causa do
		// tecClickWhenKey
		if (vm.questao.complemento) {
			vm.questao.complemento = null;
		}
		
		$timeout(function() {
			vm.questao.complemento = complemento;
			tecQuestaoEmbed.syncComplemento(vm);
		});
		if (complemento == 'comentario' || complemento == 'banca') {
			tec.desabilitarSelecao();
		} else {
			tec.habilitarSelecao();
		}
		if (complemento == 'teoria') {
			vm.capituloAberto.id = vm.questao.capitulo;
			vm.capituloAberto.aberto = true;
		}
	}
	
	function fecharComplemento() {
		vm.questao.complemento = null;
		vm.capituloAberto.aberto = false;
		tec.habilitarSelecao();
		tecQuestaoEmbed.syncComplemento(vm);
	}
	
	function descricaoComplementoAtivo() {
		return {
			"comentario": "comentário",
			"teoria": "teoria",
			"detalhes": "detalhes",
			"discussao": "discussão"
		}[vm.questao.complemento];
	}
	
	function scrollSeNecessario() {
		$timeout(function() {
			var inicioEnunciado = $("#cadernoTop");
			if (inicioEnunciado.length && !inicioEnunciado.isScrolledIntoView()) {
				$(".navegacao-caderno").scrollToElement({ skipAnimation: true });
			} if (tec.isMobile()) {
				$(".navegacao-caderno").scrollToElement({ skipAnimation: true });
			}
		});
	}
	
	function scrollParaComplementos() {
		$timeout(function() {
			$(".questao-complementos").scrollToElement({ skipAnimation: true });
		});
	}
	
	function exibirFavorita() {
		if (vm.questao.exibicaoFavorita) {
			vm.questao.exibicaoFavorita = false;
			vm.ocultarFavorita();
			return;
		}
		if (!$.isAssinanteLogado()) {
			mostrarAlertaExclusivoParaAssinantes();
			return;
		}

		fecharComplemento();
		ocultarAnotacao();
		vm.questao.exibicaoFavorita = true;
		
		if (tec.isLogado()) {
			if (!vm.pastasFavoritas) {
				recarregarPastasFavoritas();
			} else {
				atualizarPastaFavoritaAtual();
			}
		} else {
			vm.pastasFavoritas = [];
			var pastaFake = { id: 0, nome: "Sem Classificação", ativa: true};
			vm.pastasFavoritas.push(pastaFake);
		}
	}

	function exibirAnotacao() {
		if (vm.questao.exibicaoAnotacao) {
			vm.questao.exibicaoAnotacao = false;
			vm.ocultarAnotacao();
			return;
		}
		if (!$.isAssinanteLogado()) {
			mostrarAlertaExclusivoParaAssinantes();
			return;
		}

		fecharComplemento();
		ocultarFavorita();
		vm.questao.exibicaoAnotacao = true;

		if (tec.isLogado()) {
			notificarAlteracaoAnotacao();
		}
	}
	
	function exibirNotificacaoFavoritada(pastaFavoritaNome) {
		Toastify({
		  text: "Questão Favoritada na pasta " + pastaFavoritaNome,
		  duration: 2500,
		  gravity: "top", // `top` or `bottom`
		  position: "center", // `left`, `center` or `right`
		  stopOnFocus: true, // Prevents dismissing of toast on hover
		  className: "success"
		}).showToast();
	}
	
	function ocultarFavorita() {
		vm.questao.exibicaoFavorita = false;
	}
	
	function ocultarAnotacao() {
		vm.questao.exibicaoAnotacao = false;
	}
	
	function exibirNotificacaoJaFavoritada() {
		if (!(vm.questao.notificacaoJaFavoritadaExibida === true)) {
			vm.questao.notificacaoJaFavoritadaExibida = true;		
			Toastify({
			  text: "Questão já foi favoritada.",
			  duration: 2500,
			  gravity: "top", // `top` or `bottom`
			  position: "center", // `left`, `center` or `right`
			  stopOnFocus: true, // Prevents dismissing of toast on hover
			  className: "info"
			}).showToast();					
		}
	}

	function mostrarModalFavorita() {
		if (!vm.pastasFavoritas) {
			recarregarPastasFavoritas().then(function() {
				$("#modalSalvarFavorita").modal({
					backdrop: false,
					show: true
				});
			});
		} else {
			atualizarPastaFavoritaAtual();
			$("#modalSalvarFavorita").modal({
				backdrop: false,
				show: true
			});
		}
	}

	function ativarCriarPastaFavorita() {
		vm.modoCriarPastaFavorita = true;
	}

	function cancelarCriarPastaFavorita() {
    	vm.modoCriarPastaFavorita = false;
    	vm.novaPastaFavoritas = null;
	}

	function salvarFavorita(carregarUltimaPasta, criarPasta) {
		vm.ocultarFavorita();
		if (vm.questao.favorita === true && carregarUltimaPasta === true && (typeof vm.questao.anotacao === 'undefined' || vm.questao.anotacao.length == vm.questao.temAnotacao)) {
			exibirNotificacaoJaFavoritada();
			return;
		}
		
		if (!tec.isLogado()) {
			tec.alert('Esta função está disponível somente para cadernos salvos na sua conta.', 'Recurso não disponível');
			return;
        }

		if (carregarUltimaPasta === true) {
			if (!vm.pastasFavoritas) {
				recarregarPastasFavoritas();
			} else {
				atualizarPastaFavoritaAtual();
			}
		}

		var promisePasta = Promise.resolve();
		if (criarPasta && vm.novaPastaFavoritas != null) {
			promisePasta = tecDadosQuestao.criarPastaFavoritas(vm.novaPastaFavoritas)
				.then(function(pasta) {
					vm.pastasFavoritas.push(pasta);
					vm.questao.pastaFavorita = pasta.id;
				});
		}

		promisePasta.then(function() {
			return tecDadosQuestao.salvarFavorita(vm.questao.idQuestao, { pasta: vm.questao.pastaFavorita });
		})
		.then(function() { 
			recarregarPastasFavoritas();
			vm.questao.favorita = true;

			$("#modalSalvarFavorita").modal("hide");

			// botão proxima favorita
			if (vm.caderno && vm.caderno.listaFavoritas) {
				vm.caderno.botaoFavoritaHabilitado = false;
				if (vm.caderno.listaFavoritas.indexOf(vm.questao.idQuestao) < 1) {
					vm.caderno.listaFavoritas.push(vm.questao.idQuestao);
					if (vm.caderno.listaFavoritas.length > 1) {
						vm.caderno.botaoFavoritaHabilitado = true;
					}
				} else {
					if (vm.caderno.listaFavoritas.length > 1) {
						vm.caderno.botaoFavoritaHabilitado = true;
					}
				}
			}
			//

			var pastaFavoritaNome = vm.pastasFavoritas.find(pasta => pasta.id == vm.questao.pastaFavorita).nome;
			exibirNotificacaoFavoritada(pastaFavoritaNome);
		});
	}
	
	function editarAnotacao() {
		vm.questao.exibirAnotacaoSemEditor = false;
	}
	
	function exibirBotaoSalvar(html) {
		if (!html) return false;
	
		return html
		  .replace(/<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '') // remove any "empty" <p>
		  .replace(/<br\s*\/?>/gi, '')                      // remove <br>
		  .replace(/&nbsp;/gi, '')                          // remove &nbsp;
		  .replace(/\s+/g, '')                              // remove all whitespace
		  .length > 0;
    }

	function salvarAnotacao() {
		if (!tec.isLogado()) {
			tec.alert('Esta função está disponível somente para cadernos salvos na sua conta.', 'Recurso não disponível');
			return;
		}

		tecDadosQuestao.salvarAnotacao(vm.questao.idQuestao, { anotacao: vm.questao.anotacao })
		.then(function() {
			vm.questao.temAnotacao = vm.questao.anotacao && vm.questao.anotacao.length;

			vm.ocultarAnotacao();
			vm.questao.exibirAnotacaoSemEditor = false;

			// botão proxima anotada
			if (vm.caderno && vm.caderno.listaAnotadas) {
				vm.caderno.botaoAnotadaHabilitado = false;
				if (vm.caderno.listaAnotadas.indexOf(vm.questao.idQuestao) < 1) {
					vm.caderno.listaAnotadas.push(vm.questao.idQuestao);
					if (vm.caderno.listaAnotadas.length > 1) {
						vm.caderno.botaoAnotadaHabilitado = true;
					}
				} else {
					if (vm.caderno.listaAnotadas.length > 1) {
						vm.caderno.botaoAnotadaHabilitado = true;
					}
				}
			}

			Toastify({
			  text: "Anotação salva",
			  duration: 2500,
			  gravity: "top", // `top` or `bottom`
			  position: "center", // `left`, `center` or `right`
			  stopOnFocus: true, // Prevents dismissing of toast on hover
			  className: "success"
			}).showToast();
		});
	}

	function removerAnotacao() {
		if (!tec.isLogado()) {
			tec.alert('Esta função está disponível somente para cadernos salvos na sua conta.', 'Recurso não disponível');
			return;
		}

		tec.confirm("Deseja remover esta anotação?", "Confirmação", function(result) {
			if (result) {
				tecDadosQuestao.salvarAnotacao(vm.questao.idQuestao, { anotacao: "" })
					.then(function() {
						vm.questao.temAnotacao = false;
						vm.questao.anotacao = null;
						vm.questao.exibirAnotacaoSemEditor = false;

						vm.ocultarAnotacao();

						// botão proxima anotada
						if (vm.caderno && vm.caderno.listaAnotadas) {
							vm.caderno.botaoAnotadaHabilitado = false;
							var elemento = vm.caderno.listaAnotadas.indexOf(vm.questao.idQuestao);
							if (elemento > -1) {
								vm.caderno.listaAnotadas.splice(elemento, 1);
								if (vm.caderno.listaAnotadas.length > 0) {
									vm.caderno.botaoAnotadaHabilitado = true;
								}
							}
						}

						Toastify({
						  text: "Anotação removida",
						  duration: 2500,
						  gravity: "top", // `top` or `bottom`
						  position: "center", // `left`, `center` or `right`
						  stopOnFocus: true, // Prevents dismissing of toast on hover
						  className: "success"
						}).showToast();
					});
			}
		});
	}

	function removerFavorita(semConfirmar) {
		if (!vm.questao.favorita) {
			vm.ocultarFavorita();
			return;
		}

		if (semConfirmar) {
			executarRemoverFavorita();
		} else {
			tec.confirm("Deseja remover esta favorita?", "Confirmação", function(result) {
				if (result) {
					executarRemoverFavorita();
				}
			});
		}
	}

	function executarRemoverFavorita() {
		tecDadosQuestao.removerFavorita(vm.questao.idQuestao)
			.then(function() {
				vm.questao.favorita = false;

				$("#modalSalvarFavorita").modal("hide");

				// botão proxima favorita
				if (vm.caderno && vm.caderno.listaFavoritas) {
					vm.caderno.botaoFavoritaHabilitado = false;
					var elemento = vm.caderno.listaFavoritas.indexOf(vm.questao.idQuestao);
					if (elemento > -1) {
						vm.caderno.listaFavoritas.splice(elemento, 1);
						if (vm.caderno.listaFavoritas.length > 0) {
							vm.caderno.botaoFavoritaHabilitado = true;
						}
					}
				}

				Toastify({
					text: "Questão desfavoritada",
					duration: 2500,
					gravity: "top",
					position: "center",
					stopOnFocus: true,
					className: "success"
				}).showToast();
			});
	}

	function notificarAlteracaoAnotacao() {
		var limite = 4000;
		var caracteres = vm.questao.anotacao ? vm.questao.anotacao.length : 0;
		vm.questao.caracteresDisponiveisAnotacao = limite - caracteres;
		
		vm.questao.temAnotacao = vm.questao.anotacao && vm.questao.anotacao.length;
		if (vm.questao.temAnotacao) {
			vm.questao.anotacaoDisplay = $sce.trustAsHtml(vm.questao.anotacao);
			vm.questao.exibirAnotacaoSemEditor = true;
		} else {
			vm.questao.exibirAnotacaoSemEditor = false;
		}
		
	}

	function abrirFormularioErro() {
		tecDadosQuestao.buscarRevisaoGabarito(vm.questao.idQuestao).then(function(data) {
			vm.temRevisaoGabarito = data.boolean;
			vm.abrirReportErro = true;
		});
	}
	
	function enviarFormularioErro() {
		vm.msgPreencherDetalheErro = false;

		// Se mostrar o textarea:
		if (vm.subTipoErro == 'ESPECIFIQUE' || vm.subTipoErro == 'ERRO_DE_DIGITACAO_OU_PORTUGUES' || 
			vm.tipoErro == 'ASSUNTO_ASSOCIADO_INCORRETO' ||  vm.tipoErro == 'MATERIA_ASSOCIADA_INCORRETA' || 
			vm.tipoErro == 'QUESTAO_DESATUALIZADA' ) {
			
			if (vm.descricaoErro.length > 0) {
				vm.msgPreencherDetalheErro = false;
			} else {
				vm.msgPreencherDetalheErro = true;
				return;
			}
		}
		
		var assunto = "";

		if (vm.tipoErro == 'DIFERENTE_DO_GABARITO_OFICIAL' ||
			vm.tipoErro == 'ERRO_NO_ENUNCIADO' || 
			vm.tipoErro == 'ASSUNTO_ASSOCIADO_INCORRETO' ||
			vm.tipoErro == 'QUESTAO_DESATUALIZADA' ||
			vm.tipoErro.startsWith('ERRO_NO_COMENTARIO')) {
			
			tecDadosQuestao.salvarErro(vm.questao.idQuestao, vm.tipoErro, vm.subTipoErro, vm.descricaoErro )
			.then(function() {
				vm.abrirReportErro = false;
				vm.zerarFormularioNotificacao();
			});
			
		} else { 
			if (vm.tipoErro == 'MATERIA_ASSOCIADA_INCORRETA') {
				assunto = $.decodeHtml("A matéria associada está incorreta - questão " + vm.questao.idQuestao);
			}
			
			var conteudo = "<strong>" + vm.erroQuestaoTipo[vm.tipoErro] + "</strong><br />";
			if (vm.subTipoErro) {
				conteudo += vm.erroQuestaoSubTipo[vm.subTipoErro] + "<br /><br /><br />";
			}
			if (vm.descricaoErro.length > 0) {
				conteudo += vm.descricaoErro + "<br /><br /><br />";
			}
			
			tecDadosQuestao.notificarErro(vm.questao.idQuestao, assunto, conteudo)
			.then(function() {
				vm.abrirReportErro = false;
				vm.zerarFormularioNotificacao();
			});
		}
	}
	
	function zerarFormularioNotificacao() {
		vm.tipoErro = null;
		vm.subTipoErro = null;
		vm.abrirReportErro = false;
		vm.descricaoErro = "";
		vm.msgPreencherDetalheErro = false;
	}
	
	function alternarExibirAssunto(mostrar) {
		vm.exibirAssunto = mostrar;
	}

	function alternarExibirConcurso(mostrar) {
		vm.exibirConcurso = mostrar;
	}

	function alternarExibirResolucao(mostrar) {
		vm.exibirResolucao = mostrar;
	}
	
	function resolucaoAcertos() {
		return vm.questao.numeroAcertos;
	}
	
	function resolucaoErros() {
		return vm.resolucaoTotal() - vm.resolucaoAcertos();
	}
	
	function resolucaoTotal() {
		return vm.questao.numeroQuestoesResolvidas;
	}
	
	function getTextoDoComplementoAberto() {
		if (vm.questao.complemento == 'comentario') {
			return "Comentário do professor";
		} else if (vm.questao.complemento == 'teoria') {
			return "Conteúdo teórico";
		} else if (vm.questao.complemento == 'banca') {
			return "Solução fornecida pela banca";
		} else if (vm.questao.complemento == 'detalhes') {
			return "Detalhes da questão";
		} else if (vm.questao.complemento == 'discussao') {
			return "Fórum de discussão";
		}
	}	
	
	function buscarDescricaoDaAlternativa (posicao) {
		var i = posicao - 1;
		if (vm.questao.tipoQuestao == 'MULTIPLA_ESCOLHA') {
			return vm.alternativasME[i];
		} else {
			return vm.questao.alternativas[i];
		}
	}
	
	// private functions
	function recarregarPastasFavoritas() {
		return tecDadosQuestao.carregarPastasFavoritas()
			.then(function(pastas) {
				vm.pastasFavoritas = pastas;

				atualizarPastaFavoritaAtual();
			});
	}
	
	function atualizarPastaFavoritaAtual() {
		if (!vm.questao.pastaFavorita) {
			vm.questao.pastaFavorita = vm.pastasFavoritas[0].id;
			$(vm.pastasFavoritas).each(function(index, pasta) {
				if (pasta.ultimaAlterada) {
					vm.questao.pastaFavorita = pasta.id;
				}
			});
		}
	}

	function dataPublicacaoFormatada() {
		if(vm.questao.dataPublicacao != null) {
			if (typeof vm.questao.dataPublicacao === 'object') {
				var array = vm.questao.dataPublicacao.$.split(" ");
				return array[0];
			} else if (typeof vm.questao.dataPublicacao === 'string') {
				return vm.questao.dataPublicacao;
			}
		}
		return "Não publicada";
	}

	function getSessao(idCaderno) {
		var sessaoObj = localStorage.getItem(idCaderno + "["+userId+"]");
		if (!sessaoObj) {
			var sessao = {acertos: 0, erros: 0, resolvidas: 0};
			return sessao;
		} else {
			var sessao = JSON.parse(sessaoObj);
			return sessao;
		}
	}

	function setSessao(idCaderno, sessao) {
		localStorage.setItem(idCaderno + "["+userId+"]", JSON.stringify(sessao));
	}

	function resetSessao(idCaderno) {
		var sessao = {acertos: 0, erros: 0, resolvidas: 0};
		localStorage.setItem(idCaderno + "["+userId+"]", JSON.stringify(sessao));
	}

	//https://tecconcursos.atlassian.net/browse/TEC-2485
	//Alteração no iframe do caderno - enviar mensagem da questão e resolução para a janela pai
	function postMessageComResolucaoQuestao(data){
		var acertou;
		var idQuestao;
		if (data.questao) {
			idQuestao = data.questao.idQuestao;
			acertou = data.questao.alternativaSelecionada == data.questao.numeroAlternativaCorreta;
		} else {
			idQuestao = data.resolucao.idQuestao;
			acertou = data.resolucao.acertou;
		}
		var message = 'resolucao;'+ idQuestao + ';' + acertou;
		window.parent.postMessage(message, "*");
		return data;
	}
	
	function alterarModoExibicaoComentarioAbaixo() {		
		vm.modoExibicaoComentario.codigo = "ABAIXO";
		vm.modoExibicaoComentario.descricao = "Abaixo";
		vm.modoExibicaoComentario.icone = "abaixo";

		localStorage.setItem("tec.modoExibicaoComentario" + "["+userId+"]", vm.modoExibicaoComentario.codigo);

		$(".questao-complementos")[0].scrollIntoView({ behavior: "smooth" });
	}

	function alterarModoExibicaoComentarioAcima() {
		vm.modoExibicaoComentario.codigo = "ACIMA";
		vm.modoExibicaoComentario.descricao = "Acima";
		vm.modoExibicaoComentario.icone = "acima";

		localStorage.setItem("tec.modoExibicaoComentario" + "["+userId+"]", vm.modoExibicaoComentario.codigo);
	}

	function alterarModoExibicaoComentarioAoLado() {
		vm.modoExibicaoComentario.codigo = "AO_LADO";
		vm.modoExibicaoComentario.descricao = "Ao lado";
		vm.modoExibicaoComentario.icone = "ao-lado";

		localStorage.setItem("tec.modoExibicaoComentario" + "["+userId+"]", vm.modoExibicaoComentario.codigo);
	}

	function alterarModoExibicaoForumAbaixo() {		
		vm.modoExibicaoForum.codigo = "ABAIXO";
		vm.modoExibicaoForum.descricao = "Abaixo";
		vm.modoExibicaoForum.icone = "abaixo";

		localStorage.setItem("tec.modoExibicaoForum" + "["+userId+"]", vm.modoExibicaoForum.codigo);

		$(".questao-complementos")[0].scrollIntoView({ behavior: "smooth" });
	}

	function alterarModoExibicaoForumAcima() {
		vm.modoExibicaoForum.codigo = "ACIMA";
		vm.modoExibicaoForum.descricao = "Acima";
		vm.modoExibicaoForum.icone = "acima";

		localStorage.setItem("tec.modoExibicaoForum" + "["+userId+"]", vm.modoExibicaoForum.codigo);
	}

	function alterarModoExibicaoForumAoLado() {
		vm.modoExibicaoForum.codigo = "AO_LADO";
		vm.modoExibicaoForum.descricao = "Ao lado";
		vm.modoExibicaoForum.icone = "ao-lado";

		localStorage.setItem("tec.modoExibicaoForum" + "["+userId+"]", vm.modoExibicaoForum.codigo);
	}


	function mostrarRemoverQuestao() {
		var temCaderno = typeof vm.caderno !== 'undefined' && vm.caderno != null;

		// Caderno fechado (não aberto): permite remover
		if (temCaderno && !vm.caderno.cadernoAberto) {
			return true;
		}

		// Contexto de caderno via jsonCaderno com id válido
		if (
			typeof jsonCaderno !== 'undefined' &&
			jsonCaderno != null &&
			typeof jsonCaderno.id !== 'undefined' &&
			jsonCaderno.id > 0
		) {
			return true;
		}

		// Caderno com idCaderno explícito
		if (temCaderno && Object.prototype.hasOwnProperty.call(vm.caderno, 'idCaderno')) {
			return true;
		}

		// Sem contexto de caderno (ex.: "Ver como Curso"): não mostrar e não crashar no digest
		return false;
	}

	function removerQuestao() {
		if (!$.isAssinanteLogado()) {
			mostrarAlertaExclusivoParaAssinantes();
		} else if (jsonCaderno) {
			tec.confirm("Deseja remover esta questão deste caderno?", "Confirmação", function(result) {
				if (result) {
					if (typeof jsonCaderno.id !== 'undefined') {
						tecDadosQuestao.removerQuestaoIdCaderno(jsonCaderno.id, vm.questao.idQuestao)
						.then(function() {
							if (typeof vm.caderno !== 'undefined') {
								vm.caderno.recarregarIndice = true;
							}
							window.location.reload();
						});
					} else {
						tecDadosQuestao.removerQuestaoAtualCaderno(jsonCaderno.idCaderno)
						.then(function() {
							if (typeof vm.caderno !== 'undefined') {
								vm.caderno.recarregarIndice = true;
							}
							window.location.reload();
						});
					}
				}
			});
		}
	}

	function adicionarQuestaoDeUmCadernoAOutro() {
		if (!$.isAssinanteLogado()) {
			mostrarAlertaExclusivoParaAssinantes();
		} else if (jsonCaderno) {
			abrirModalAdicionarQuestao(true);
		}
	}

	function adicionarQuestaoACaderno() {
		if (!$.isAssinanteLogado()) {
			mostrarAlertaExclusivoParaAssinantes();
		} else {
			abrirModalAdicionarQuestao(false);
		}
	}

	function toggleTextoAssociado() {
		const $el = $(".link-textoassociado");
		
		if ($el.length) {
		  $el.click();
		}
	}

	function abrirModalAdicionarQuestao(entreCadernos) {
		var params = {};
		params.entreCadernos = entreCadernos;
		alertify.idQuestaoAdicionar = vm.questao.idQuestao;

		if (!alertify.modalAdicionarQuestao && $.isAssinanteLogado()) {
			criarDialogAdicionarQuestaoCaderno()
				.then(function() {
					alertify.modalAdicionarQuestao(params);
				});
		} else {
			alertify.modalAdicionarQuestao(params);
		}
	}

	function criarDialogAdicionarQuestaoCaderno() {
		if(!$.isAssinanteLogado()) {
			mostrarAlertaExclusivoParaAssinantes();
			return Promise.reject();
		}

		return buscarPastas().then(function() {
			alertify.dialog("modalAdicionarQuestao", function factory() {
				return {
					main:function(params){

						this.entreCadernos = params.entreCadernos;

						var selectPastas = "<select name=\"dialogAdicionarQuestaoCadernoPasta\" id=\"idDialogAdicionarQuestaoCadernoPasta\" class=\"form-control\">";
							selectPastas += "<option value=\"\" label=\"\"></option>"
						for (var i in vm.pastas) {
							var pasta = vm.pastas[i];
							selectPastas += "<option value=\""+pasta.id+"\" label=\""+pasta.nome+"\">"+pasta.nome+"</option>"
						}

						selectPastas += "</select>";

						var selectSubPastas = "<select name=\"dialogAdicionarQuestaoCadernoSubPasta\" id=\"idDialogAdicionarQuestaoCadernoSubPasta\" class=\"form-control\" disabled=\"disabled\"></select>";

						var selectCaderno = "<select name=\"selectCadernoModalAdicionarQuestaoCaderno\" id=\"idSelectCadernoModalAdicionarQuestaoCaderno\" class=\"form-control\" disabled=\"disabled\"></select>";

						this.message = "<div id=\"adicionar-questao-entre-cadernos-modal\">" +
										"<p class=\"titulo\">Selecione a pasta e o caderno em que deseja inserir esta questão:</p>" +
										"<p class=\"adicionar-cadernos-modal-titulo\"><strong>Pasta de destino:</strong></p>" +
										"<p class=\"adicionar-cadernos-modal-opcao\">" +
										selectPastas +
										"</p>" +
										"<p class=\"adicionar-cadernos-modal-titulo\"><strong>Subpasta de destino:</strong></p>" +
										"<p class=\"adicionar-cadernos-modal-opcao\">" +
										selectSubPastas +
										"</p>" +
										"<p class=\"adicionar-cadernos-modal-titulo\"><strong>Caderno:</strong></p>" +
										"<p class=\"adicionar-cadernos-modal-opcao\">" +
										selectCaderno +
										"</p>" +
										"</div>"
					},
					setup:function(){
						return {
							buttons:[{text: "<button onclick=\"$(this).parent().click()\" id=\"idSalvarBtnModalAdicionarQuestaoCaderno\" class=\"btn btn-tec adicionar-questao-modal-botao-criar\" disabled>SALVAR</button>"},
								{text: "<button onclick=\"$(this).parent().click()\" class=\"btn btn-tec adicionar-questao-modal-botao-fechar\"><span class='glyphicon glyphicon-remove unir-cadernos-botao-fechar-icone'></span><span>FECHAR</span></button>"}],
							focus: { element:0 },
							options: {
								title: "Adicionar Questão",
								onshow: function() {
									$("#idDialogAdicionarQuestaoCadernoPasta").on('change', function() {
										processarAlteracaoPastaModalAdicionarQuestao();
									});

									$("#idDialogAdicionarQuestaoCadernoSubPasta").on('change', function() {
										processarAlteracaoSubpastaModalAdicionarQuestao();
									});

									$("#idSelectCadernoModalAdicionarQuestaoCaderno").on('change', function() {
										processarAlteracaoCadernoModalAdicionarQuestao();
									});

									$("#adicionar-questao-entre-cadernos-modal").parents(".ajs-dialog-height").height(450);
								},
								onclose: function() {
									$(".ajs-dialog-height").height('auto');
								}
							}

						};
					},
					prepare:function(){
						this.setContent(this.message);
						$('.ajs-dialog').removeClass("ajs-dialog-height ajs-dialog-height-warning");
						$('.ajs-dialog').addClass(vm.temCadernoUnidoLegado ? "ajs-dialog-height-warning" : "ajs-dialog-height");
					},
					callback:function(closeEvent) {
						if (closeEvent.index == 0) {
							var ajsBody = $(this.elements.body);

							if (this.entreCadernos) {
								vm.adicionarQuestaoEntreCadernos();
							} else {
								vm.enviarQuestaoACaderno();
							}
							vm.modalAdicionarQuestaoValues.caderno = null;
						}
					}
				}
			});
		});
	}

	function buscarPastas() {
		if (tecDadosQuestao.pastas.length != 0) {
			return Promise.resolve();
		}

		return tecDadosQuestao.listarPastas()
			.then(function(data) {
				tecDadosQuestao.pastas = data.pastas;
				vm.pastas = tecDadosQuestao.pastas;

				vm.subpastasPorPasta = {};
				$(vm.pastas).each(function(_, pasta) {
					if (!!pasta.subpastas && pasta.subpastas.length > 0) {
						vm.subpastasPorPasta[pasta.id] = pasta.subpastas
					}
				});
			});
	}

	function processarAlteracaoPastaModalAdicionarQuestao() {
		$("#idSalvarBtnModalAdicionarQuestaoCaderno").attr('disabled', 'disabled');
		$("#idSalvarBtnModalAdicionarQuestaoCaderno").parent().attr('disabled', 'disabled');

		var idPasta = $("#idDialogAdicionarQuestaoCadernoPasta").val();

		var idSubpasta = $("#idDialogAdicionarQuestaoCadernoSubPasta").val();

		var subpastas = vm.subpastasPorPasta[idPasta];

		$("#idSelectCadernoModalAdicionarQuestaoCaderno option").each(function() {
			$(this).remove();
		});

		$("#idDialogAdicionarQuestaoCadernoSubPasta option").each(function() {
			$(this).remove();
		});
		if (subpastas) {
			$("#idDialogAdicionarQuestaoCadernoSubPasta").removeAttr('disabled');

			$("#idDialogAdicionarQuestaoCadernoSubPasta").append("<option></option>");
			for (var i in subpastas) {
				var pasta = subpastas[i];

				$("#idDialogAdicionarQuestaoCadernoSubPasta").append("<option value=\""+pasta.id+"\" label=\""+pasta.nome+"\">"+pasta.nome+"</option>");
			}
		} else {
			$("#idDialogAdicionarQuestaoCadernoSubPasta").attr('disabled', 'disabled');
		}

		buscarCadernosPasta(idPasta, idSubpasta)
			.then(function(cadernos) {
				popularCampoCadernoModalAdicionarQuestaoCaderno(cadernos);
			});
	}

	function processarAlteracaoSubpastaModalAdicionarQuestao() {
		$("#idSalvarBtnModalAdicionarQuestaoCaderno").attr('disabled', 'disabled');
		$("#idSalvarBtnModalAdicionarQuestaoCaderno").parent().attr('disabled', 'disabled');

		var idPasta = $("#idDialogAdicionarQuestaoCadernoPasta").val();

		var idSubpasta = $("#idDialogAdicionarQuestaoCadernoSubPasta").val();

		$("#idSelectCadernoModalAdicionarQuestaoCaderno option").each(function() {
			$(this).remove();
		});

		buscarCadernosPasta(idPasta, idSubpasta)
			.then(function(cadernos) {
				popularCampoCadernoModalAdicionarQuestaoCaderno(cadernos);
			});
	}

	function buscarCadernosPasta(idPasta, idSubpasta) {
		return tecDadosQuestao.listarItensSubpasta(idPasta, idSubpasta, "nome")
			.then(function(itens) {
				vm.cadernos = itens;
				return itens;
			});
	}

	function popularCampoCadernoModalAdicionarQuestaoCaderno(cadernos) {
		if (cadernos) {
			$("#idSelectCadernoModalAdicionarQuestaoCaderno").removeAttr('disabled');

			$("#idSelectCadernoModalAdicionarQuestaoCaderno").append("<option></option>");
			for (var i in cadernos) {
				var caderno = cadernos[i];

				$("#idSelectCadernoModalAdicionarQuestaoCaderno").append("<option value=\""+caderno.id+"\" label=\""+caderno.nome+"\">"+caderno.nome+"</option>");
			}
		} else {
			$("#idSelectCadernoModalAdicionarQuestaoCaderno").attr('disabled', 'disabled');
		}
	}

	function processarAlteracaoCadernoModalAdicionarQuestao() {
		var idCaderno = $("#idSelectCadernoModalAdicionarQuestaoCaderno").val();

		if (idCaderno && idCaderno != "") {
			vm.modalAdicionarQuestaoValues.caderno = idCaderno;
			$("#idSalvarBtnModalAdicionarQuestaoCaderno").removeAttr('disabled');
			$("#idSalvarBtnModalAdicionarQuestaoCaderno").parent().removeAttr('disabled', 'disabled');
		} else {
			$("#idSalvarBtnModalAdicionarQuestaoCaderno").attr('disabled', 'disabled');
			$("#idSalvarBtnModalAdicionarQuestaoCaderno").parent().attr('disabled', 'disabled');
	}
	}

	function adicionarQuestaoEntreCadernos() {
		if (vm.modalAdicionarQuestaoValues.caderno == null) {
			return;
		}

		var params = {
			idQuestao: alertify.idQuestaoAdicionar,
			idCadernoOrigem: vm.caderno.idCaderno
		}
		if (vm.modalAdicionarQuestaoValues.caderno) {
			tecDadosQuestao.adicionarQuestaoEntreCadernos(vm.modalAdicionarQuestaoValues.caderno, params)
				.then(function(resp) {
					if (resp.erro && resp.mensagem == 'QUESTAO_JA_EXISTE_NO_CADERNO') {
						tec.alert("Questão já existe no caderno informado.", "Atenção!");
					} else if (resp.erro && resp.mensagem == 'QUESTAO_CADERNO_FORMATO_INCOMPATIVEL') {
						tec.alert("Não é possível adicionar uma questão discursiva a um caderno de questões objetivas e vice-versa.", "Atenção!");
					} else if (resp.erro && resp.mensagem == 'LIMITE_QUESTOES_CADERNO') {
						tec.alert("Limite de questões por caderno atingido.", "Atenção!");
					} else {
						tec.alert("Questão adicionada com sucesso!", "Aviso");
					}
				});
		}
	}

	function enviarQuestaoACaderno() {
		if (vm.modalAdicionarQuestaoValues.caderno == null) {
			return;
		}

		var params = {
			idQuestao: alertify.idQuestaoAdicionar
		}
		if (vm.modalAdicionarQuestaoValues.caderno) {
			tecDadosQuestao.adicionarQuestaoACaderno(vm.modalAdicionarQuestaoValues.caderno, params)
				.then(function(resp) {
					if (resp.erro && resp.mensagem == 'QUESTAO_JA_EXISTE_NO_CADERNO') {
						tec.alert("Questão já existe no caderno informado.", "Atenção!");
					} if (resp.erro && resp.mensagem == 'QUESTAO_CADERNO_FORMATO_INCOMPATIVEL') {
						tec.alert("Não é possível adicionar uma questão discursiva a um caderno de questões objetivas e vice-versa.", "Atenção!");
					} else {
						tec.alert("Questão adicionada com sucesso!", "Aviso");
					}
				});
		}
	}
};

TecQuestaoCadernoCtrl.prototype = Object.create(TecQuestaoCtrl.prototype);
// se mudar a assinatura, mudar nos outros controllers tambem
function TecQuestaoCadernoCtrl($scope, $timeout, $location, $sce, tec, tecDadosQuestao, tecQuestaoEmbed) {
	TecQuestaoCtrl.apply(this, arguments);
	
	var vm = this;
	vm.inicializarQuestao = inicializarQuestao;
	vm.numeroQuestaoExibicao = numeroQuestaoExibicao;
	vm.resolverQuestao = resolverQuestao;
	vm.questaoAnterior = questaoAnterior;
	vm.questaoSeguinte = questaoSeguinte;
	vm.questaoAleatoria = questaoAleatoria;
	vm.questaoNaoResolvida = questaoNaoResolvida;
	vm.questaoDoTopicoSeguinte = questaoDoTopicoSeguinte;
	vm.questaoDoTopicoAnterior = questaoDoTopicoAnterior;
	vm.desfazerUltimaQuestao = desfazerUltimaQuestao;
	vm.questaoProximaFavorita = questaoProximaFavorita;
	vm.questaoProximaAnotada = questaoProximaAnotada;
	vm.botaoDesfazerHabilitado = false;
	vm.abrirQuestaoPorNumero = abrirQuestaoPorNumero;
	vm.navegacaoAvancada = true;
	vm.deslisarParaEsquerda = deslisarParaEsquerda;
	vm.deslisarParaDireita = deslisarParaDireita;
	vm.sincronizarDadosDoCaderno = sincronizarDadosDoCaderno;
	vm.textoQuestoesMarcadas = "";
	vm.proximaMarcada = proximaMarcada;
	vm.resolverTodasMarcadas = resolverTodasMarcadas;
	vm.alternarExibirAssunto = alternarExibirAssunto;
	vm.alternarExibirConcurso = alternarExibirConcurso;
	vm.alternarExibirResolucao = alternarExibirResolucao;
	vm.ultimoRequest = null;
	vm.abrirQuestaoDoIndice = abrirQuestaoDoIndice;
	vm.resolverQuestaoIneditaOuAdaptada = resolverQuestaoIneditaOuAdaptada;
	vm.atualizarAlternativa = false;
	vm.telaDesktop = window.screen.width > 1200;
	vm.alterarOrdenacaoForum = alterarOrdenacaoForum;

	$scope.$on("abrir-questao", function(event, numeroQuestao) {
		vm.abrirQuestaoDoIndice(numeroQuestao);
	});

	function inicializarQuestao(caderno, relogio, capituloAberto, getExibirResolucao) {
		vm.alternativasClicadas = [0, 0, 0, 0, 0];
		vm.caderno = caderno;
		vm.relogio = relogio;
		vm.navegacao = true;
		vm.capituloAberto = capituloAberto;
		
		// reescrever se tiver outra forma melhor de fazer isso
		vm.telaDesktop = window.screen.width > 1200;

		if (vm.exibirAssunto === null) {
			vm.exibirAssunto = caderno.exibirAssunto;
		}

		if (vm.exibirConcurso === null) {
			vm.exibirConcurso = caderno.exibirConcurso;
		}

		if (vm.caderno.numeroEmBranco == 0) {
			vm.navegacaoAvancada = false;
		}

		vm.exibirResolucao = getExibirResolucao;

		habilitarBotaoDesfazer();

		var idCaderno = vm.caderno.idCaderno;
		var sessao = getSessao(idCaderno);

		if (vm.caderno.numeroQuestaoAtual !== sessao.historico[sessao.historico.length - 1]) {
			sessao.historico.push(vm.caderno.numeroQuestaoAtual);

			if (sessao.historico.length > 20) {
				sessao.historico.shift();
			}

			setSessao(idCaderno, sessao);

		}

		if (!vm.configuracoesUsuario) {
			tecDadosQuestao.carregarConfiguracoesDoAluno().then(function(dados){
				vm.configuracoesUsuario = dados;

				if (!vm.configuracoesUsuario.hasOwnProperty("mostrarNumeroComentarioForum")) {
					vm.configuracoesUsuario["mostrarNumeroComentarioForum"] = true;
				}
				
				definirSwipeCaderno();
			});
		} else {
			definirSwipeCaderno();
		}

		// carrega a questao sem salvar alternativa selecionada
		var params = { atualizarCronometro: !vm.relogio.pausa };
		return tecDadosQuestao.carregarQuestaoCaderno(vm.caderno.idCaderno, vm.caderno.numeroQuestaoAtual, params)
		.then(vm.callbackCarregarQuestao)
		.then(vm.sincronizarDadosDoCaderno)
		.then(function() {
			inicializarSwipeQuestoes();
		}).catch(function(erro) {
			console.log("Erro: ", erro);
		});
	}
	
	function inicializarSwipeQuestoes() {
		if (!vm.habilitaSwipe) {
			return;
		}
		setTimeout(function() {
			var element = document.getElementById('slider');
			if (element) {
				if (window.mySwipe) {
					window.mySwipe.kill();
				}
				window.mySwipe = new Swipe(element, {
				  startSlide: 1,
				  auto: 0,
				  draggable: true,
				  autoRestart: false,
				  continuous: false,
				  disableScroll: false,
				  stopPropagation: true,
				  ignore: ".swipe-ignore, img, tr, td, td p, textarea",
				  callback: function(index, element) {
					if (index == 0) {
					  	questaoAnterior();
					} else if (index == 2) {
					  	questaoSeguinte();						
					}
				  },
				  transitionEnd: function(index, element) {}
				});
				
				$("#swipe-left").height($("#swipe-control").height())
				$("#swipe-right").height($("#swipe-control").height())
				window.myQuestaoAnterior = questaoAnterior;
				window.myQuestaoSeguinte = questaoSeguinte;
			} else {
				inicializarSwipeQuestoes();
			}
			
		}, 100);
	}

	function alterarOrdenacaoForum(ordenar) {
		vm.configuracoesUsuario["ordenacaoForum"] = ordenar;
	}
	
	function numeroQuestaoExibicao() {
		return vm.caderno.numeroQuestaoAtual + " de " + vm.caderno.numeroTotalQuestoes;
	}
	
	function definirSwipeCaderno() {
		var swipeAtivo = vm.configuracoesUsuario.hasOwnProperty("ativarSwipeCaderno") ? vm.configuracoesUsuario.ativarSwipeCaderno : true;
		if (tec.isMobile() && swipeAtivo) {
			vm.habilitaSwipe = true;
		} else {
			vm.habilitaSwipe = false;
		}
	}
	
	function exibirAlertaInvestidaCompleta() {
		var mostrar = localStorage.getItem("tec.exibirAnimacaoInvestida" + "["+userId+"]") === "true";
		if(mostrar) {
			confetti({
			  particleCount: 100,
			  spread: 70,
			  origin: { y: 0.6 }
			});				
		}

		Toastify({
		  text: "🎉 Parabéns, você completou a investida de hoje!",
		  duration: 3500,
		  gravity: "top", // `top` or `bottom`
		  position: "right", // `left`, `center` or `right`
		  stopOnFocus: true, // Prevents dismissing of toast on hover
		  className: "info"
		}).showToast();
	}
	
	function resolverQuestao() {		
		var tempoRelogio = tecDadosQuestao.relogio.obterTempoEParar();

		vm.aguardandoResolucao = true;

		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			resolver: true,
			atualizarCronometro: !vm.relogio.pausa,
			questaoAdaptadaOuInedita: vm.questao.questaoAdaptadaOuInedita,
			requestId: "alterar-questao-atual-caderno",
			resolvida: false,
			tempoResolucao: tempoRelogio,
		};

		tecDadosQuestao.alterarQuestaoAtualCaderno(vm.caderno.idCaderno, params)
		.then(vm.postMessageComResolucaoQuestao)
		.then(vm.callbackCarregarQuestaoSemScroll)
		.then(function() {
			if (vm.questao.conquistouInvestida) {
				exibirAlertaInvestidaCompleta();
			}
		})
		.then(vm.sincronizarDadosDoCaderno)
		.then(vm.limparAlternativasRiscadas)
		.then(function() {
			vm.aguardandoResolucao = false;
		})
		.catch(function(data) {
			if ((typeof data === 'string' || data instanceof String) && data.includes("duplicada")) {
			} else if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}

			vm.aguardandoResolucao = false;
		});
	}
	
	function habilitarBotaoDesfazer () {
		var idCaderno = vm.caderno.idCaderno;
		var sessao = getSessao(idCaderno);

		if (sessao.historico.length > 1 || (sessao.historico.length > 0 && sessao.historico[0] !== vm.caderno.numeroQuestaoAtual))  {
			vm.botaoDesfazerHabilitado = true;
		} else {
			vm.botaoDesfazerHabilitado = false;
		}
	}

	function getSessao(idCaderno) {
		var sessaoObj = localStorage.getItem(idCaderno + "["+userId+"]");
		if (!sessaoObj) {
			var sessao = {historico: []};
			return sessao;
		} else {
			var sessao = JSON.parse(sessaoObj);

			if (!sessao.historico) {
				sessao.historico = [];
			}

			return sessao;
		}
	}

	function setSessao(idCaderno, sessao) {
		localStorage.setItem(idCaderno + "["+userId+"]", JSON.stringify(sessao));
	}

	function resetSessao(idCaderno) {
		var sessao = {historico: []};
		localStorage.setItem(idCaderno + "["+userId+"]", JSON.stringify(sessao));
	}

	function resolverQuestaoIneditaOuAdaptada() {
		if(vm.questao.assinanteAvancado) {
			resolverQuestao();
		}
	}
	
	function deslisarParaDireita() {
		var celular = isMobile();
		if (celular) {
			questaoAnterior()
		}
	}

	function deslisarParaEsquerda() {
		var celular = isMobile();
		if (celular) {
			vm.questaoSeguinte()
		}
	}
	
	function questaoAnterior($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		if (vm.ultimoRequest == null) {
			vm.ultimoRequest = "";
			var numeroQuestao = vm.caderno.numeroQuestaoAtual - 1;
			var resolvida = vm.questao.correcaoQuestao != null || vm.questao.anulada;
			var params = { alternativa: vm.questao.alternativaSelecionada, atualizarCronometro: !vm.relogio.pausa, idQuestao: vm.questao.idQuestao, resolvida: resolvida };
			
			// TEC-1391
			var req = serializarRequisicao("/questaoAnterior", params);
			if (vm.ultimoRequest != req) {
				vm.ultimoRequest = req;
				vm.carregrQuestaoAcabou = false;
				tecDadosQuestao.alterarQuestaoAtualCaderno(vm.caderno.idCaderno, params)
				.then(function() {
					abrirQuestao(numeroQuestao > 0 ? numeroQuestao : vm.caderno.numeroTotalQuestoes);
				})
				.then(function() {
					var listener = $scope.$watch("vm.carregrQuestaoAcabou", function() {
						if(vm.carregrQuestaoAcabou) {
							vm.ultimoRequest = null;
							vm.carregrQuestaoAcabou = false;

							listener();
						}
					});
				}).catch(function(erro)  {
				    console.log("Erro: ", erro);
					vm.ultimoRequest = null;
			    });
			}
		}
	}
	
	function questaoSeguinte($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		if (vm.ultimoRequest == null) {
			vm.ultimoRequest = "";
			var numeroQuestao = vm.caderno.numeroQuestaoAtual + 1;
			var resolvida = vm.questao.correcaoQuestao != null || vm.questao.anulada;
			var params = { alternativa: vm.questao.alternativaSelecionada, atualizarCronometro: !vm.relogio.pausa, idQuestao: vm.questao.idQuestao, resolvida: resolvida };
	
			// TEC-1391
			var req = serializarRequisicao("/questaoSeguinte", params);
			if (vm.ultimoRequest != req) {
				vm.ultimoRequest = req;
				vm.carregrQuestaoAcabou = false;
				tecDadosQuestao.alterarQuestaoAtualCaderno(vm.caderno.idCaderno, params)
				.then(function() {
					abrirQuestao(numeroQuestao <= vm.caderno.numeroTotalQuestoes ? numeroQuestao : 1);
				})
				.then(function() {
					var listener = $scope.$watch("vm.carregrQuestaoAcabou", function() {
						if(vm.carregrQuestaoAcabou) {
							vm.ultimoRequest = null;
                            vm.carregrQuestaoAcabou = false;

                            listener();
						}
					});
				}).catch(function(erro)  {
				    console.log("Erro: ", erro);
					vm.ultimoRequest = null;
				});
			}
		}
	}
	
	function questaoAleatoria($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		if (vm.ultimoRequest != null){
			return;
		}

		vm.ultimoRequest = "";

		// flag atualizarAlternativa por causa de (TEC-2922) e (TEC-3263)
		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			atualizarCronometro: !vm.relogio.pausa,
			atualizarAlternativa: vm.atualizarAlternativa
		};

		var req = serializarRequisicao("/questaoAleatoria", params);

		if (vm.ultimoRequest == req) {
        	return;
        }

		vm.ultimoRequest = req;

		tecDadosQuestao.buscarAleatoriaCaderno(vm.caderno.idCaderno, params)
		.then(function (data) {
			var proximaQuestao = data.proximaQuestao;
			var numeroQuestao = proximaQuestao.numeroQuestao;
			if (vm.caderno.numeroQuestaoAtual == numeroQuestao) {
				vm.navegacaoAvancada = false;
			} else {
				abrirQuestao(numeroQuestao);
			}
		}).then(function() {
			vm.ultimoRequest = null;
		}).catch(function(erro) {
			console.log("Erro: ", erro);
		});
	}

	function questaoNaoResolvida($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		if (vm.ultimoRequest != null){
			return;
		}

		vm.ultimoRequest = "";

		// flag atualizarAlternativa por causa de (TEC-2922) e (TEC-3263)
		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			atualizarCronometro: !vm.relogio.pausa,
			atualizarAlternativa: vm.atualizarAlternativa
		};

		var req = serializarRequisicao("/questaoNaoResolvida", params);

		if (vm.ultimoRequest == req) {
			return;
		}

		vm.ultimoRequest = req;
	
		tecDadosQuestao.buscarProximaNaoResolvidaCaderno(vm.caderno.idCaderno, params)
		.then(function (data) { 
			var proximaQuestao = data.proximaQuestao;
            var numeroQuestao = proximaQuestao.numeroQuestao;
			if (vm.caderno.numeroQuestaoAtual == numeroQuestao) {
				vm.navegacaoAvancada = false;
			} else {
				abrirQuestao(numeroQuestao);
			}
		}).then(function() {
			vm.ultimoRequest = null;
		});
	}

	function questaoProximaFavorita($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		if (vm.ultimoRequest != null){
			return;
		}

		vm.ultimoRequest = "";

		// flag atualizarAlternativa por causa de (TEC-2922) e (TEC-3263)
		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			atualizarCronometro: !vm.relogio.pausa,
			atualizarAlternativa: vm.atualizarAlternativa
		};

		var req = serializarRequisicao("/questaoProximaFavorita", params);

		if (vm.ultimoRequest == req) {
			return;
		}

		vm.ultimoRequest = req;

		tecDadosQuestao.buscarProximaFavorita(vm.caderno.idCaderno, params)
		.then(function (data) { 
			var proximaQuestao = data.proximaQuestao;
            var numeroQuestao = proximaQuestao.numeroQuestao;
			if (vm.caderno.numeroQuestaoAtual != numeroQuestao) {
				abrirQuestao(numeroQuestao);
			}
		}).then(function() {
			vm.ultimoRequest = null;
		}).catch(function(erro)  {
		    console.log("Erro: ", erro);
			vm.ultimoRequest = null;
		});
	}

	function questaoProximaAnotada($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		if (vm.ultimoRequest != null){
			return;
		}

		vm.ultimoRequest = "";

		// flag atualizarAlternativa por causa de (TEC-2922) e (TEC-3263)
		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			atualizarCronometro: !vm.relogio.pausa,
			atualizarAlternativa: vm.atualizarAlternativa
		};

		var req = serializarRequisicao("/questaoProximaAnotada", params);

		if (vm.ultimoRequest == req) {
			return;
		}

		vm.ultimoRequest = req;

		tecDadosQuestao.buscarProximaAnotada(vm.caderno.idCaderno, params)
			.then(function (data) {
				var proximaQuestao = data.proximaQuestao;
				var numeroQuestao = proximaQuestao.numeroQuestao;
				if (vm.caderno.numeroQuestaoAtual != numeroQuestao) {
					abrirQuestao(numeroQuestao);
				}
			}).then(function() {
			vm.ultimoRequest = null;
		});
	}

	function questaoDoTopicoSeguinte($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		if (vm.ultimoRequest != null){
			return;
		}

		vm.ultimoRequest = "";

		// flag atualizarAlternativa por causa de (TEC-2922) e (TEC-3263)
		var params = {
				alternativa: vm.questao.alternativaSelecionada,
				atualizarCronometro: !vm.relogio.pausa,
				atualizarAlternativa: vm.atualizarAlternativa
		};

		var req = serializarRequisicao("/questaoTopicoSeguinte", params);

		if (vm.ultimoRequest == req) {
			return;
		}

		vm.ultimoRequest = req;

		tecDadosQuestao.buscarQuestaoDoTopicoSeguinteCaderno(vm.caderno.idCaderno, params)
		.then(function (data) { 
			var proximaQuestao = data.proximaQuestao;
            var numeroQuestao = proximaQuestao.numeroQuestao;

			abrirQuestao(numeroQuestao);
		}).then(function() {
			vm.ultimoRequest = null;
		});
	}

	function questaoDoTopicoAnterior($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		if (vm.ultimoRequest != null){
			return;
		}

		vm.ultimoRequest = "";

		// flag atualizarAlternativa por causa de (TEC-2922) e (TEC-3263)
		var params = {
				alternativa: vm.questao.alternativaSelecionada,
				atualizarCronometro: !vm.relogio.pausa,
				atualizarAlternativa: vm.atualizarAlternativa
		};

		var req = serializarRequisicao("/questaoTopicoAnterior", params);

		if (vm.ultimoRequest == req) {
			return;
		}

		vm.ultimoRequest = req;

		tecDadosQuestao.buscarQuestaoDoTopicoAnteriorCaderno(vm.caderno.idCaderno, params)
		.then(function (data) { 
			var proximaQuestao = data.proximaQuestao;
            var numeroQuestao = proximaQuestao.numeroQuestao;

			abrirQuestao(numeroQuestao);
		}).then(function() {
			vm.ultimoRequest = null;
		});
		
	}

	function desfazerUltimaQuestao($event) {
		vm.alternativasNavegacaoPendente = [];
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}
		var idCaderno = vm.caderno.idCaderno;
		var sessao = getSessao(idCaderno);

		if (sessao.historico.length > 0) {
			var ultimo = sessao.historico[sessao.historico.length - 1];

			if (ultimo === vm.caderno.numeroQuestaoAtual) {
				if (sessao.historico.length > 1) {
					sessao.historico.pop();
					ultimo = sessao.historico[sessao.historico.length - 1];
				} else {
					ultimo = 0;
				}
			}

			if (ultimo > 0) {
				if (vm.ultimoRequest == null) {
					vm.ultimoRequest = "";

					var params = {
						alternativa: vm.questao.alternativaSelecionada,
						atualizarCronometro: !vm.relogio.pausa,
						idQuestao: vm.questao.idQuestao,
						resolvida: vm.questao.correcaoQuestao != null || vm.questao.anulada
					};

					// TEC-1391
					var req = serializarRequisicao("/desfazerUltimaQuestao", params);
					if (vm.ultimoRequest != req) {
						vm.ultimoRequest = req;
						tecDadosQuestao.alterarQuestaoAtualCaderno(vm.caderno.idCaderno, params)
						.then(function() {
							setSessao(idCaderno, sessao);
							abrirQuestao(ultimo);
						})
						.then(function() {
							vm.ultimoRequest = null;
						}).catch(function(erro)  {
						    console.log("Erro: ", erro);
							vm.ultimoRequest = null;
						});
					}
				}
			}
		}
	}

	function abrirQuestaoPorNumero() {
		vm.alternativasNavegacaoPendente = [];
		var mensagem = "Deseja acessar qual questão do caderno? (número entre 1 e " + vm.caderno.numeroTotalQuestoes + ")";
		tec.prompt(mensagem, vm.caderno.numeroQuestaoAtual, "Acessar questão por número", function(result) {
			if (result != null) {
				var numeroQuestao = result.replace(/\D/g, "");
				if (numeroQuestao.length) {
					numeroQuestao = parseInt(numeroQuestao);
					if (numeroQuestao > vm.caderno.numeroTotalQuestoes) {
						tec.alert("Posição informada extrapola o índice do caderno. Por favor, coloque um número válido.", "Ir para");
					} else {
						var resolvida = vm.questao.correcaoQuestao != null || vm.questao.anulada;
						// salvar alternativa selecionada
						var params = { alternativa: vm.questao.alternativaSelecionada, atualizarCronometro: !vm.relogio.pausa, resolvida: resolvida };
						tecDadosQuestao.alterarQuestaoAtualCaderno(vm.caderno.idCaderno, params)
						.then(function() {
							abrirQuestao(numeroQuestao);
						});
					}
				}
			}
		});
	}
	
	function abrirQuestaoDoIndice(numeroQuestao) {
		vm.alternativasNavegacaoPendente = [];
		abrirQuestao(numeroQuestao);
	}

	function abrirQuestao(numeroQuestao) {
		vm.atualizarAlternativa = false;
		if (numeroQuestao <= 0) {
			numeroQuestao = 1;
		}
		if (numeroQuestao > vm.caderno.numeroTotalQuestoes) {
			numeroQuestao = vm.caderno.numeroTotalQuestoes;
		}
		
		vm.caderno.numeroQuestaoAtual = numeroQuestao;
		inicializarQuestao(vm.caderno, vm.relogio, vm.capituloAberto, vm.exibirResolucao);
	}
	
	function isMobile() {
		var isMobile = false; // initiate as false
		// device detection
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
		    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
			isMobile = true;
		}
		return isMobile;
	}
	
	function sincronizarDadosDoCaderno(data) {
		// Finalizar caderno caso tenha terminado questoes em branco
		if (vm.questao.cadernoFinalizado == true && (vm.caderno.finalizado != vm.questao.cadernoFinalizado)) {
			vm.caderno.finalizado = true;
			vm.relogio.finalizado = true;
			tecDadosQuestao.finalizarCaderno(vm.caderno.idCaderno);
		}
		
		// Atualizar questoes marcadas
		var numero = parseInt(vm.questao.numeroQuestoesMarcadas);
		if (numero == 0) {
			vm.textoQuestoesMarcadas = null;
		} else if (numero == 1) {
			vm.textoQuestoesMarcadas = numero + " questão assinalada mas não resolvida"
		} else {
			vm.textoQuestoesMarcadas = numero + " questões assinaladas mas não resolvidas"
		}

		// botão proxima favorita
		vm.caderno.botaoFavoritaHabilitado = false;
		if (vm.caderno.listaFavoritas && vm.caderno.listaFavoritas.length > 1) {
			vm.caderno.botaoFavoritaHabilitado = true;
		} else if (vm.caderno.listaFavoritas && vm.caderno.listaFavoritas.length === 1 && vm.caderno.listaFavoritas[0] != vm.questao.idQuestao) {
			vm.caderno.botaoFavoritaHabilitado = true;
		}
		//

		// botão proxima anotada
		vm.caderno.botaoAnotadaHabilitado = false;
		if (vm.caderno.listaAnotadas && vm.caderno.listaAnotadas.length > 1) {
			vm.caderno.botaoAnotadaHabilitado = true;
		} else if (vm.caderno.listaAnotadas && vm.caderno.listaAnotadas.length === 1 && vm.caderno.listaAnotadas[0] != vm.questao.idQuestao) {
			vm.caderno.botaoAnotadaHabilitado = true;
		}
	}
	
	function proximaMarcada($event) {
		if ($event && $event.currentTarget) {
			$event.currentTarget.blur();
		}

		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			atualizarCronometro: !vm.relogio.pausa
		};
		
		tecDadosQuestao.buscarProximaMarcadaNoCaderno(vm.caderno.idCaderno, params)
		.then(function (data) { 
			var numeroQuestao = data.int;
			abrirQuestao(numeroQuestao);
		});
	}
	function resolverTodasMarcadas() {
		var numeroQuestao = vm.caderno.numeroQuestaoAtual;
		tecDadosQuestao.resolverTodasMarcadas(vm.caderno.idCaderno)
		.then(function (data) {
			if (data.boolean) {
				exibirAlertaInvestidaCompleta();
			}

			abrirQuestao(numeroQuestao);
			vm.revisando = false;
		})
		.catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}
		});
	}

	function alternarExibirAssunto(mostrar) {
		vm.exibirAssunto = mostrar;
		tecDadosQuestao.salvarExibirAssunto(vm.caderno.idCaderno, mostrar);
	}

	function alternarExibirConcurso(mostrar) {
		vm.exibirConcurso = mostrar;
		tecDadosQuestao.salvarExibirConcurso(vm.caderno.idCaderno, mostrar);
	}

	function alternarExibirResolucao(mostrar) {
		vm.exibirResolucao = mostrar;
		tecDadosQuestao.salvarExibirResolucao(mostrar);
	}

	// private functions
	function serializarRequisicao(url, params) {
		var req = url;
		
		req += "?"
	    for (var key in params){
	        var attrName = key;
	        var attrValue = params[key];
	        req += attrName + "=" + attrValue + "&";
	    }
		return req;
	}
}

TecQuestaoCadernoAbertoCtrl.prototype = Object.create(TecQuestaoCtrl.prototype);
function TecQuestaoCadernoAbertoCtrl($scope, $timeout, $location, $sce, tec, tecDadosQuestao, tecQuestaoEmbed) {
	TecQuestaoCtrl.apply(this, arguments);

	var vm = this;
	vm.inicializarQuestao = inicializarQuestao;
	vm.abrirQuestaoDoIndice = abrirQuestaoDoIndice;
	vm.fecharComplementoIndice = fecharComplementoIndice;
	vm.deslogado = true;
	vm.resolverQuestao = resolverQuestao;
	vm.questaoDoTopicoSeguinte = questaoDoTopicoSeguinte;
	vm.questaoDoTopicoAnterior = questaoDoTopicoAnterior;
	vm.resolverQuestaoIneditaOuAdaptada = resolverQuestaoIneditaOuAdaptada;
	vm.quantidade = 0;
	vm.inicializarSwipeQuestoes = inicializarSwipeQuestoes;

	$scope.$on("abrir-questao", function(event, numeroQuestao) {
		vm.abrirQuestaoDoIndice(numeroQuestao);
    });

	function inicializarQuestao(config) {		
		vm.config = config;
		vm.caderno = config.caderno;
		vm.questoes = config.questoes;
		vm.usuarioGratis = config.usuarioGratis;
		vm.isAssinante = config.isAssinante;
		
		if (config.logado) {
			vm.deslogado = false;
		}

		vm.esconderIrPara = !!config.esconderIrPara;
		
		var id = vm.questoes[vm.indiceQuestaoAtual];
		if (config.questoes.length > 1) {
			vm.navegacao = true;
		}
		// adiciona como atributo do caderno para poder ser acessado pelo resumo
		// do caderno
		if(config.isFiltroQuestoes) {
			var idCaderno = vm.caderno.idCaderno;
			resetSessao(idCaderno);
		}
		vm.caderno.getSessao = getSessao;
		
		vm.isFiltroQuestoes = config.isFiltroQuestoes;
		
		// utilizado para a tela de filtro de questoes
		if(config.isFiltroQuestoes) {
			vm.questaoSeguinteTmp = vm.questaoSeguinte;
			vm.questaoSeguinte = questaoSeguinteParaFiltro;
			
			vm.questaoAnteriorTmp = vm.questaoAnterior;
			vm.questaoAnterior = questaoAnteriorParaFiltro;
			
			
			
			vm.abrirQuestaoPorNumeroTmp = vm.abrirQuestaoPorNumero;
			vm.abrirQuestaoPorNumero = abrirQuestaoPorNumeroParaFiltro;
			
		} else if(vm.questaoSeguinteTmp && vm.questaoAnteriorTmp && vm.abrirQuestaoPorNumeroTmp) {
			vm.questaoSeguinte = vm.questaoSeguinteTmp;
			vm.questaoAnterior = vm.questaoAnteriorTmp;
			vm.abrirQuestaoPorNumero = vm.abrirQuestaoPorNumeroTmp;
		}

		if ($.isLogado()) {
			if (!vm.configuracoesUsuario) {
				tecDadosQuestao.carregarConfiguracoesDoAluno().then(function(dados){
					vm.configuracoesUsuario = dados;

					if (!vm.configuracoesUsuario.hasOwnProperty("mostrarNumeroComentarioForum")) {
						vm.configuracoesUsuario["mostrarNumeroComentarioForum"] = true;
					}
					
					definirSwipeQuestoes();
					vm.inicializarSwipeQuestoes();
				});
			} else {
				definirSwipeQuestoes();
				vm.inicializarSwipeQuestoes();
			}
			
		}
		
		if(config.isFiltroQuestoes) {
			vm.quantidade = config.quantidadePorPagina;
			vm.indiceQuestaoAtual = 0;

			if(verificaListaQuestoes() && !config.filtroAberto) {
				return buscarMaisAbrirQuestoes();
			}
		}

		return vm.abrirQuestaoDeslogado(0);
	}
	
	function definirSwipeQuestoes() {
		var swipeAtivo = vm.configuracoesUsuario.hasOwnProperty("ativarSwipeCaderno") ? vm.configuracoesUsuario.ativarSwipeCaderno : true;
		if (tec.isMobile() && swipeAtivo) {
			vm.habilitaSwipe = true;
		} else {
			vm.habilitaSwipe = false;
		}
	}
	
	function inicializarSwipeQuestoes() {
		if (!vm.habilitaSwipe) {
			return;
		}
		setTimeout(function() {
			var element = document.getElementById('slider');
			if (element) {
				if (window.mySwipe) {
					window.mySwipe.kill();
				}
				window.mySwipe = new Swipe(element, {
				  startSlide: 1,
				  auto: 0,
				  draggable: true,
				  autoRestart: false,
				  continuous: false,
				  disableScroll: false,
				  stopPropagation: true,
				  ignore: ".swipe-ignore, img, tr, td, td p, textarea",
				  callback: function(index, element) {
					if (index == 0) {
					  	questaoAnteriorParaFiltro();
					} else if (index == 2) {
					  	questaoSeguinteParaFiltro();
					}
				  },
				  transitionEnd: function(index, element) {}
				});
				
				$("#swipe-left").height($("#swipe-control").height())
				$("#swipe-right").height($("#swipe-control").height())
			} else {
				inicializarSwipeQuestoes();
			}
		}, 100);
	}
	
	function questaoSeguinteParaFiltro() {
		if (vm.indiceQuestaoAtual >= vm.questoes.length - 1){
			vm.indiceQuestaoAtual = 0;
		} else {			
			vm.indiceQuestaoAtual++;
		}

		if(vm.config.questaoSeguinte) {
			vm.config.questaoSeguinte(vm.indiceQuestaoAtual, vm.abrirQuestaoDeslogado);
		} else if(verificaListaQuestoes() && !vm.config.filtroAberto) {
			buscarMaisAbrirQuestoes();
		} else {
			vm.abrirQuestaoDeslogado(vm.indiceQuestaoAtual);
		}
	}
	
	function questaoAnteriorParaFiltro() {
		if (vm.indiceQuestaoAtual <= 0) {
			//vm.indiceQuestaoAtual = vm.questoes.length - 1;
			return;
		} else {
			vm.indiceQuestaoAtual--;			
		}

		if (vm.config.questaoAnterior) {
			vm.config.questaoAnterior(vm.indiceQuestaoAtual, vm.abrirQuestaoDeslogado);
		} else if(verificaListaQuestoes() && !vm.config.filtroAberto) {
			buscarMaisAbrirQuestoes();
		} else {
			vm.abrirQuestaoDeslogado(vm.indiceQuestaoAtual);
		}
	}
	
	function verificaListaQuestoes() {
		return vm.questoes[vm.indiceQuestaoAtual] === null;
	}
	
	function abrirQuestaoPorNumeroParaFiltro() {
		var mensagem = "Deseja ver qual questão? (número entre 1 e " + (vm.questoes.length) + ")";
		tec.prompt(mensagem, vm.indiceQuestaoAtual + 1, "Acessar questão por número", function(result) {
			if (result != null) {
				var numeroQuestao = result.replace(/\D/g, "");
				if (numeroQuestao.length) {
					if (numeroQuestao > vm.questoes.length) {
						tec.alert("Posição informada extrapola o índice do caderno. Por favor, coloque um número válido.", "Ir para");
					} else {
						vm.indiceQuestaoAtual = parseInt(numeroQuestao) - 1;
						if(vm.config.abrirQuestaoPorNumero) {
							vm.config.abrirQuestaoPorNumero(vm.indiceQuestaoAtual, vm.abrirQuestaoDeslogado);
						} else if(vm.questoes[vm.indiceQuestaoAtual] === null && !vm.config.filtroAberto) {
							buscarQuestoes(1, numeroQuestao)
							.then(function(data) {
								if(data && data.questoes && data.questoes.length) {
									vm.questoes[vm.indiceQuestaoAtual] = data.questoes[0];
									vm.abrirQuestaoDeslogado(vm.indiceQuestaoAtual);
								}
							});
						} else {
							vm.abrirQuestaoDeslogado(vm.indiceQuestaoAtual);
						}
					}
				}
			}
		});
	}
	
	function buscarQuestoes(quantidade, pagina) {
		var parametros = {
				"formatos[0]": "OBJETIVA",
				// "formatos[1]": "DISCURSIVA",
				"status[0]": "AGUARDANDO_COMENTARIO",
				"status[1]": "AGUARDANDO_PUBLICACAO",
				"status[2]": "PUBLICADA",
				"quantidade": quantidade,
				"pagina": pagina
		};
		
		return tec.apiGet("/questoes/filtros/paginacao", parametros);
	}
	
	function buscarMaisAbrirQuestoes() {
		if(vm.config.callbackBuscarQuestoes) {
			var pagina = Math.floor((vm.indiceQuestaoAtual / vm.quantidade) + 1);

			vm.config.callbackBuscarQuestoes(vm.quantidade, pagina)
				.then(function(data) {
					var index = (pagina - 1) * vm.quantidade;
					var questoes = data.questoes;
					for(var i=0; i<questoes.length; i++) {
						vm.questoes[index] = questoes[i];
						index++;
					}
					return vm.abrirQuestaoDeslogado(vm.indiceQuestaoAtual);
			});
		}
	}
	
	function abrirQuestaoDoIndice(numeroQuestao) {
		if (typeof numeroQuestao == 'undefined') {
			numeroQuestao = vm.indiceQuestaoAtual;
		}
		vm.abrirQuestaoDeslogado(parseInt(numeroQuestao));
	}
	
	function fecharComplementoIndice() {
		vm.questao.complemento = null;
		abrirQuestaoDoIndice();
	}
	
	function resolverQuestaoIneditaOuAdaptada() {
		if(vm.questao.assinanteAvancado) {
			resolverQuestao();
		}
	}
	
	function exibirAlertaInvestidaCompleta() {
		var mostrar = localStorage.getItem("tec.exibirAnimacaoInvestida" + "["+userId+"]") === "true";
		if(mostrar) {
			confetti({
			  particleCount: 100,
			  spread: 70,
			  origin: { y: 0.6 }
			});				
		}

		Toastify({
		  text: "🎉 Parabéns, você completou a investida de hoje!",
		  duration: 3500,
		  gravity: "top", // `top` or `bottom`
		  position: "right", // `left`, `center` or `right`
		  stopOnFocus: true, // Prevents dismissing of toast on hover
		  className: "info"
		}).showToast();
	}

	function resolverQuestao() {
		var tempoRelogio = tecDadosQuestao.relogio.obterTempoEParar();

		vm.aguardandoResolucao = true;

		var idCaderno = vm.caderno.idCaderno;
		var sessao = getSessao(idCaderno);

		if(vm.config.filtrarQuestoes && vm.questao.hash) {
			vm.caderno.cadernoHash = vm.questao.hash;
		}

		var params = {
			requestId: "resolver-questao-caderno-aberto",
			id: vm.caderno.idCaderno,
			idQuestao: vm.questao.idQuestao,
			alternativaSelecionada: vm.questao.alternativaSelecionada,
			cadernoHash: vm.caderno.cadernoHash,
			tempoResolucao: tempoRelogio,
		};

		tecDadosQuestao.resolucaoCadernoAberto(params)
		.then(vm.postMessageComResolucaoQuestao)
		.then(function (data) {
			if (data.error) {
				exibirMensagemLimiteAtingido();
			} else {
				vm.questao.numeroAlternativaCorreta = data.resolucao.alternativa;
				vm.questao.correcaoQuestao = data.resolucao.acertou;

				if (data.resolucao.conquistouInvestida) {
					vm.questao.conquistouInvestida = true;
					exibirAlertaInvestidaCompleta();
				}

				if (vm.questao.correcaoQuestao) {
					sessao.acertos = Number(sessao.acertos) + 1;
				} else {
					sessao.erros = Number(sessao.erros) + 1;
				}
				if (!sessao.questoes) {
					sessao.questoes = {};
				}
				sessao.questoes[vm.questao.idQuestao] = {
						selecionada: vm.questao.alternativaSelecionada,
						correta: data.resolucao.alternativa,
						acertou: data.resolucao.acertou
				};

				sessao.resolvidas = Number(sessao.resolvidas) + 1;
				setSessao(idCaderno, sessao);
			}
		})
		.then(vm.limparAlternativasRiscadas)
		.then(function() {
			vm.aguardandoResolucao = false;
			tecQuestaoEmbed.syncAfterQuestaoLoad(vm);
		})
		.catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}

			vm.aguardandoResolucao = false;
		});

	}
	// private
	function getSessao(idCaderno) {
		var sessaoObj = localStorage.getItem(idCaderno + "["+userId+"]");
		if (!sessaoObj) {
			var sessao = {acertos: 0, erros: 0, resolvidas: 0};
			return sessao;
		} else {
			var sessao = JSON.parse(sessaoObj);
			return sessao;
		}
	}
	
	function setSessao(idCaderno, sessao) {
		localStorage.setItem(idCaderno + "["+userId+"]", JSON.stringify(sessao));
	}
	
	function resetSessao(idCaderno) {
		var sessao = {acertos: 0, erros: 0, resolvidas: 0};
		localStorage.setItem(idCaderno + "["+userId+"]", JSON.stringify(sessao));
	}
	
	function exibirMensagemLimiteAtingido() {
		// Extend existing 'alert' dialog
		if(!alertify.errorAlert){
		  // define a new errorAlert base on alert
		  alertify.dialog('errorAlert',function factory(){
		    return{
		            build:function(){
		                this.setHeader('Faça login para continuar');
		            }
		        };
		    },true,'alert');
		}
		// launch it.
		alertify.errorAlert("Você já atingiu o limite gratuito de resolução de questões. <br/>" +
		        "Para continuar seus estudos, selecione uma das opções abaixo: <br/>" + 
		      " - Já tem conta? <a href='https://www.tecconcursos.com.br/login'>Clique aqui</a> para logar. <br/>" +  
		      " - Ainda não possui conta? <a href='https://www.tecconcursos.com.br/cadastro'>Clique aqui</a> para se cadastrar." );
	}
	
	function questaoDoTopicoSeguinte() {
		var params = {
				indiceQuestaoAtual: vm.indiceQuestaoAtual
		};
		tecDadosQuestao.buscarQuestaoDoTopicoSeguinteCadernoAberto(vm.caderno.idCaderno, params)
		.then(function (data) { 
			var numeroQuestao = data.int;
			abrirQuestaoDoIndice(numeroQuestao);
		});
	}

	function questaoDoTopicoAnterior() {
		var params = {
				indiceQuestaoAtual: vm.indiceQuestaoAtual
		};
		tecDadosQuestao.buscarQuestaoDoTopicoAnteriorCadernoAberto(vm.caderno.idCaderno, params)
		.then(function (data) { 
			var numeroQuestao = data.int;
			abrirQuestaoDoIndice(numeroQuestao);
		});
		
	}
}

TecQuestaoModuloCtrl.prototype = Object.create(TecQuestaoCtrl.prototype);
// se mudar a assinatura, mudar nos outros controllers tambem
function TecQuestaoModuloCtrl($scope, $timeout, $location, $sce, tec, tecDadosQuestao, tecQuestaoEmbed) {
	TecQuestaoCtrl.apply(this, arguments);
	
	var vm = this;
	vm.inicializarQuestao = inicializarQuestao;
	vm.numeroQuestaoExibicao = numeroQuestaoExibicao;
	vm.resolverQuestao = resolverQuestao;
	vm.questaoAnterior = questaoAnterior;
	vm.questaoSeguinte = questaoSeguinte;
	vm.questaoAleatoria = questaoAleatoria;
	vm.questaoNaoResolvida = questaoNaoResolvida;
	vm.abrirQuestaoPorNumero = abrirQuestaoPorNumero;
	vm.navegacaoAvancada = true;
	vm.deslisarParaEsquerda = deslisarParaEsquerda;
	vm.deslisarParaDireita = deslisarParaDireita;
	vm.resolverQuestaoIneditaOuAdaptada = resolverQuestaoIneditaOuAdaptada;
	vm.desfazerUltimaQuestao = desfazerUltimaQuestao;
	vm.botaoDesfazerHabilitado = false;
	vm.inicializarSwipeQuestoes = inicializarSwipeQuestoes;

	function inicializarQuestao(questaoModulo) {
		vm.alternativasClicadas = [0, 0, 0, 0, 0];
		vm.questaoModulo = questaoModulo;
		vm.questaoModulo.numero = parseInt(vm.questaoModulo.numero);
		vm.navegacao = true;
		habilitarBotaoDesfazer();

		var idModulo = vm.questaoModulo.modulo;
		var sessao = getSessao(idModulo);

		if (vm.questaoModulo.numero !== sessao.historico[sessao.historico.length - 1]) {
			sessao.historico.push(vm.questaoModulo.numero);

			if (sessao.historico.length > 20) {
				sessao.historico.shift();
			}

			setSessao(idModulo, sessao);
		}

		if (!vm.configuracoesUsuario) {
			tecDadosQuestao.carregarConfiguracoesDoAluno().then(function(dados){
				vm.configuracoesUsuario = dados;

				if (!vm.configuracoesUsuario.hasOwnProperty("mostrarNumeroComentarioForum")) {
					vm.configuracoesUsuario["mostrarNumeroComentarioForum"] = true;
				}
				
				definirSwipeQuestoes();
				vm.inicializarSwipeQuestoes();
			});
		} else {
			definirSwipeQuestoes();
			vm.inicializarSwipeQuestoes();
		}

		return tecDadosQuestao.carregarQuestaoModulo(questaoModulo)
		.then(vm.callbackCarregarQuestao)
		.catch(function(erro) {
			console.log("Erro: " + erro);
		});
	}

	function numeroQuestaoExibicao() {
		return vm.questaoModulo.numero + " de " + vm.questaoModulo.totalQuestoes;
	}
	
	function definirSwipeQuestoes() {
		var swipeAtivo = vm.configuracoesUsuario.hasOwnProperty("ativarSwipeCaderno") ? vm.configuracoesUsuario.ativarSwipeCaderno : true;
		if (tec.isMobile() && swipeAtivo) {
			vm.habilitaSwipe = true;
		} else {
			vm.habilitaSwipe = false;
		}
	}
	
	function inicializarSwipeQuestoes() {
		if (!vm.habilitaSwipe) {
			return;
		}
		setTimeout(function() {
			var element = document.getElementById('slider');
			if (element) {
				if (window.mySwipe) {
					window.mySwipe.kill();
				}
				window.mySwipe = new Swipe(element, {
				  startSlide: 1,
				  auto: 0,
				  draggable: true,
				  autoRestart: false,
				  continuous: false,
				  disableScroll: false,
				  stopPropagation: true,
				  ignore: ".swipe-ignore, img, tr, td, td p, textarea",
				  callback: function(index, element) {
					if (index == 0) {
					  	questaoAnterior();
					} else if (index == 2) {
					  	questaoSeguinte();
					}
				  },
				  transitionEnd: function(index, element) {}
				});
				
				$("#swipe-left").height($("#swipe-control").height())
				$("#swipe-right").height($("#swipe-control").height())
			} else {
				inicializarSwipeQuestoes();
			}
		}, 100);
	}
	
	function exibirAlertaInvestidaCompleta() {
		var mostrar = localStorage.getItem("tec.exibirAnimacaoInvestida" + "["+userId+"]") === "true";
		if(mostrar) {
			confetti({
			  particleCount: 100,
			  spread: 70,
			  origin: { y: 0.6 }
			});				
		}

		Toastify({
		  text: "🎉 Parabéns, você completou a investida de hoje!",
		  duration: 3500,
		  gravity: "top", // `top` or `bottom`
		  position: "right", // `left`, `center` or `right`
		  stopOnFocus: true, // Prevents dismissing of toast on hover
		  className: "info"
		}).showToast();
	}

	function resolverQuestao() {
		var tempoRelogio = tecDadosQuestao.relogio.obterTempoEParar();

		vm.aguardandoResolucao = true;

		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			idQuestao: vm.questao.idQuestao,
			tempoResolucao: tempoRelogio,
			requestId: "resolver-questao-caderno-aula",
		};

		return tecDadosQuestao.alterarQuestaoModulo(vm.questaoModulo, params)
		.then(vm.postMessageComResolucaoQuestao)
		.then(function (data) { 
			vm.questao.numeroAlternativaCorreta = data.resolucao.alternativa;
			vm.questao.correcaoQuestao = data.resolucao.acertou;
			vm.questaoModulo.resolverQuestaoCallback(data.resolucao);

			if (data.resolucao.conquistouInvestida) {
				vm.questao.conquistouInvestida = true;
				exibirAlertaInvestidaCompleta();
			}
		})
		.then(function() {
			vm.aguardandoResolucao = false;
			tecQuestaoEmbed.syncAfterQuestaoLoad(vm);
		})
		.catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}

			vm.aguardandoResolucao = false;
		});
		
	}

	function habilitarBotaoDesfazer () {
		var idModulo = vm.questaoModulo.modulo;
		var sessao = getSessao(idModulo);

		if (sessao.historico.length > 1 || (sessao.historico.length > 0 && sessao.historico[0] !== vm.questaoModulo.numero))  {
			vm.botaoDesfazerHabilitado = true;
		} else {
			vm.botaoDesfazerHabilitado = false;
		}
	}

	function getSessao(idModulo) {
		var sessaoObj = localStorage.getItem(idModulo + "["+userId+"]");

		if (!sessaoObj) {
			var sessao = {historico: []};
			return sessao;
		} else {
			var sessao = JSON.parse(sessaoObj);

			if (!sessao.historico) {
				sessao.historico = [];
			}

			return sessao;
		}
	}

	function setSessao(idModulo, sessao) {
		localStorage.setItem(idModulo + "["+userId+"]", JSON.stringify(sessao));
	}

	function resetSessao(idModulo) {
		var sessao = {historico: []};
		localStorage.setItem(idModulo + "["+userId+"]", JSON.stringify(sessao));
	}

	function desfazerUltimaQuestao() {
		var idModulo = vm.questaoModulo.modulo;
		var sessao = getSessao(idModulo);

		if (sessao.historico.length > 0) {
			var ultimo = sessao.historico[sessao.historico.length - 1];

			if (ultimo === vm.questaoModulo.numero) {
				if (sessao.historico.length > 1) {
					sessao.historico.pop();
					ultimo = sessao.historico[sessao.historico.length - 1];
				} else {
					ultimo = 0;
				}
			}

			if (ultimo > 0) {
				var params = { exercicio: vm.questaoModulo.numero } 
				if (vm.questaoModulo.numero == ultimo) {
					vm.navegacaoAvancada = false;
				} else {
					setSessao(idModulo, sessao);
					abrirQuestao(parseInt(ultimo));
				}
			}
		}
	}

	function resolverQuestaoIneditaOuAdaptada() {
		resolverQuestao();
	}

	function deslisarParaDireita() {
		var celular = isMobile();
		if (celular) {
			questaoAnterior();
		}
	}

	function deslisarParaEsquerda() {
		var celular = isMobile();
		if (celular) {
			vm.questaoSeguinte();
		}
	}

	function questaoAnterior() {
		var numeroQuestao = vm.questaoModulo.numero - 1;
		abrirQuestao(numeroQuestao > 0 ? numeroQuestao : vm.questaoModulo.totalQuestoes);
	}
	
	function questaoSeguinte() {
		var numeroQuestao = vm.questaoModulo.numero + 1;
		abrirQuestao(numeroQuestao <= vm.questaoModulo.totalQuestoes ? numeroQuestao : 1);
	}
	
	function questaoAleatoria() {
		var params = { exercicio: vm.questaoModulo.numero } 
		tecDadosQuestao.buscarAleatoriaModulo(vm.questaoModulo, params)
		.then(function (data) { 
			var numeroQuestao = data.int;
			if (vm.questaoModulo.numero == numeroQuestao) {
				vm.navegacaoAvancada = false;
			} else {
				abrirQuestao(parseInt(numeroQuestao));
			}
		});
	}
	
	function questaoNaoResolvida() {
		var params = { exercicio: vm.questaoModulo.numero } 
		tecDadosQuestao.buscarProximaNaoResolvidaModulo(vm.questaoModulo, params)
		.then(function (data) { 
			var numeroQuestao = data.int;
			if (vm.questaoModulo.numero == numeroQuestao) {
				vm.navegacaoAvancada = false;
			} else {
				abrirQuestao(parseInt(numeroQuestao));
			}
		});
	}

	function abrirQuestaoPorNumero() {
		var mensagem = "Deseja acessar qual exercício? (número entre 1 e " + vm.questaoModulo.totalQuestoes + ")";
		tec.prompt(mensagem, vm.questaoModulo.numero, "Acessar exercício por número", function(result) {
			if (result != null) {
				var numeroQuestao = result.replace(/\D/g, "");
				if (numeroQuestao.length) {
					if (numeroQuestao > vm.questaoModulo.totalQuestoes) {
						tec.alert("Posição informada extrapola o índice do caderno. Por favor, coloque um número válido.", "Ir para");
					} else {
						abrirQuestao(parseInt(numeroQuestao));
					}
				}
			}
		});
	}
	
	function abrirQuestao(numeroQuestao) {
		if (numeroQuestao <= 0) {
			numeroQuestao = 1;
		}
		if (numeroQuestao > vm.questaoModulo.totalQuestoes) {
			numeroQuestao = vm.questaoModulo.totalQuestoes;
		}
		
		vm.questaoModulo.numero = numeroQuestao;
		if ($location.search().exercicio) {
			$location.search("exercicio", numeroQuestao);
		}

		inicializarQuestao(vm.questaoModulo);
	}
	
	function isMobile() {
		var isMobile = false; // initiate as false
		// device detection
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
		    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
			isMobile = true;
		}
		return isMobile;
	}
}

module.controller("TecQuestaoCtrl", TecQuestaoCtrl);
module.controller("TecQuestaoCadernoCtrl", TecQuestaoCadernoCtrl);
module.controller("TecQuestaoCadernoAbertoCtrl", TecQuestaoCadernoAbertoCtrl);
module.controller("TecQuestaoModuloCtrl", TecQuestaoModuloCtrl);

// ////////////////////////////

module.directive("tecQuestaoComentario", function() {
	return {
		restrict: "A",
		scope: {
			params: "&tecQuestaoComentario",
			caderno: "=",
			relogio: "=",
			questao: "=",
			questaoAnterior: "&",
			questaoSeguinte: "&",
			questaoAleatoria: "&",
			questaoNaoResolvida: "&",
			questaoTopicoAnterior: "&",
			questaoTopicoSeguinte: "&",
			desfazerUltimaQuestao: "&",
			questaoProximaFavorita: "&",
			questaoProximaAnotada: "&",
			modoExibicaoComentario: "="
		},
		templateUrl: "questao-comentario-directive",
		controller: "TecQuestaoComentarioCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			var params = scope.params();
			ctrl.buscarConteudo(scope.questao, params, scope.caderno, scope.relogio, 
			scope.modoExibicaoComentario, scope.questaoAnterior, scope.questaoSeguinte,
			scope.questaoAleatoria, scope.questaoNaoResolvida, scope.questaoTopicoAnterior, 
			scope.questaoTopicoSeguinte, scope.desfazerUltimaQuestao, scope.questaoProximaFavorita, scope.questaoProximaAnotada);
		},
		bindToController: {
			tipoComentario: "=?"
		}
	};
});

function TecQuestaoComentarioCtrl($scope, $timeout, $location, $sce, tec, tecDadosQuestao) {

	var vm = this;
	vm.idQuestao = null;
	vm.avaliarComentario = avaliarComentario;
	vm.cadernoAberto = false;
	vm.isLogado = isLogado;
	vm.cadernoHash = null;
	vm.questaoAdaptadaOuInedita = false;
	vm.assinanteAvancado = false;
	vm.tokenPreVisualizacao = null;
	vm.questao = null;
	vm.getAlternativa = getAlternativa;
	vm.isAlternativaSelecionada = isAlternativaSelecionada;
	vm.riscarAlternativa = riscarAlternativa;
	vm.limparAlternativasRiscadas = limparAlternativasRiscadas;
	vm.resolverQuestao = resolverQuestao;
	vm.resolverQuestaoIneditaOuAdaptada = resolverQuestaoIneditaOuAdaptada;
	vm.alertaResolverQuestaoIneditaOuAdaptada = alertaResolverQuestaoIneditaOuAdaptada;
	vm.verificarResolucao = verificarResolucao;
	vm.verificarAlternativaGabarito = verificarAlternativaGabarito;
	vm.verificarAlternativaErro = verificarAlternativaErro;
	vm.verificarAlternativaSemMarcacao = verificarAlternativaSemMarcacao;
	vm.mostrarAlertaExclusivoParaAssinantes = mostrarAlertaExclusivoParaAssinantes;
	vm.mostrarAlertaExclusivoParaAssinanteAvancado = mostrarAlertaExclusivoParaAssinanteAvancado;
	vm.gerarCelebracaoAleatoria = gerarCelebracaoAleatoria;
	vm.alternativasME = ["A", "B", "C", "D", "E"];
	vm.selecionarAlternativa = selecionarAlternativa;
	vm.callbackCarregarQuestaoSemScroll = callbackCarregarQuestaoSemScroll;
	vm.callbackCarregarQuestao = callbackCarregarQuestao;
	vm.mostrarTextoAssociado = mostrarTextoAssociado;
	vm.zerarFormularioNotificacao = zerarFormularioNotificacao;
	vm.buscarDescricaoDaAlternativa = buscarDescricaoDaAlternativa;
	vm.postMessageComResolucaoQuestao = postMessageComResolucaoQuestao;
	vm.sincronizarDadosDoCaderno = sincronizarDadosDoCaderno;
	vm.modoExibicaoComentario = { codigo: "ACIMA", descricao: "Acima", icone: "acima" }; // default
	vm.telaDesktop = window.screen.width > 1200;
	vm.setSessao = setSessao;
	vm.solicitarComentario = solicitarComentario;

	vm.tipoComentario = (angular.isUndefined(vm.tipoComentario)) ? "texto" : vm.tipoComentario;

	vm.terminouCarregar = false;

	vm.buscarConteudo = function(questao, params, caderno, relogio, modoExibicaoComentario, 
							questaoAnterior, questaoSeguinte, questaoAleatoria, questaoNaoResolvida,
							questaoDoTopicoAnterior, questaoDoTopicoSeguinte, desfazerUltimaQuestao, questaoProximaFavorita, questaoProximaAnotada) {
		vm.questao = questao;
		vm.idQuestao = questao.idQuestao;
		vm.usuarioGratis = params.usuarioGratis;
		vm.deslogado = params.deslogado;
		vm.assinanteAvancado = questao.assinanteAvancado;
		vm.questaoAdaptadaOuInedita = questao.questaoAdaptadaOuInedita;
		vm.tokenPreVisualizacao = params.tokenPreVisualizacao;
		vm.possuiToken = params.tokenPreVisualizacao != null && params.tokenPreVisualizacao != ""
		vm.relogio = relogio;
		
		vm.cadernoQuestoes = params.cadernoQuestoes;
		vm.exibirBotoesTrocarTopico = params.exibirBotoesTrocarTopico;
		
		vm.navegacao = params.navegacao;
		vm.ocultarNavegacao = params.ocultarNavegacao;
		
		vm.navegacaoAvancada = params.navegacaoAvancada;
		
		vm.config = params.config;
		
		if (vm.config) {
			vm.questoes = vm.config.questoes;			
		}
	
		vm.botaoDesfazerHabilitado = params.botaoDesfazerHabilitado;
		
		vm.telaDesktop = window.screen.width > 1200;
		
		vm.questaoAnterior = questaoAnterior;
		vm.questaoSeguinte = questaoSeguinte;
		
		vm.questaoAleatoria = questaoAleatoria;
		vm.questaoNaoResolvida = questaoNaoResolvida;
		
		vm.questaoDoTopicoAnterior = questaoDoTopicoAnterior;
		vm.questaoDoTopicoSeguinte = questaoDoTopicoSeguinte;
		
		vm.desfazerUltimaQuestao = desfazerUltimaQuestao;
		vm.questaoProximaFavorita = questaoProximaFavorita;
		vm.questaoProximaAnotada = questaoProximaAnotada;

		vm.modoExibicaoComentario = modoExibicaoComentario;

		var modoExibicaoComentarioSalvo = localStorage.getItem("tec.modoExibicaoComentario" + "["+userId+"]");
		 
		if (modoExibicaoComentarioSalvo) {
			if (modoExibicaoComentarioSalvo == 'ACIMA') {
				vm.modoExibicaoComentario.codigo = "ACIMA";
				vm.modoExibicaoComentario.descricao = "Acima";
				vm.modoExibicaoComentario.icone = "acima";
			} else if (modoExibicaoComentarioSalvo == 'ABAIXO') {
				vm.modoExibicaoComentario.codigo = "ABAIXO";
				vm.modoExibicaoComentario.descricao = "Abaixo";
				vm.modoExibicaoComentario.icone = "abaixo";
			} else if (modoExibicaoComentarioSalvo = "AO_LADO") {
				vm.modoExibicaoComentario.codigo = "AO_LADO";
				vm.modoExibicaoComentario.descricao = "Ao lado";
				vm.modoExibicaoComentario.icone = "ao-lado";
			}
		}

		if (modoExibicaoComentarioSalvo == 'ABAIXO') {
			$timeout(function(){ $(".questao-complementos")[0].scrollIntoView({ behavior: "smooth" }); });
		}
		
		vm.configuracoesUsuario = params.configuracoesUsuario;

		if (caderno) {
			vm.cadernoAberto = caderno.cadernoAberto;
			vm.idCaderno = caderno.idCaderno
			vm.caderno = caderno;

			if (vm.cadernoAberto) {
				vm.cadernoHash = caderno.cadernoHash;
			}
		}

		$scope.$watch("vm.tipoComentario", function() {
			vm.terminouCarregar = false;
			verificarMostrarSolicitar();

			if (!vm.mostrarSolicitar) {
				vm.buscarDados();
			}
		});
	};

	vm.buscarDados = function() {
		if (vm.cadernoAberto) {
			vm.comentario = {};

			if(vm.questaoAdaptadaOuInedita && !vm.assinanteAvancado) {
				vm.comentario = {};
				buscarSomenteDadosDoComentario();
			} else {
				buscarComentarioParaCadernoAberto(vm.idCaderno);
			}
		} else {
			if(vm.questaoAdaptadaOuInedita) {
				if(vm.assinanteAvancado || vm.possuiToken) {
					buscarComentario();
				} else {
					vm.comentario = {};
					buscarSomenteDadosDoComentario();
				}
			} else if (isLogado()) {
				buscarComentario();
			} else {
				vm.comentario = {};
				// buscar a foto do professor
				buscarSomenteDadosDoComentario();
			}
		}
	}

	function verificarMostrarSolicitar() {
		switch (vm.tipoComentario) {
			case 'texto':
				vm.mostrarSolicitar = !vm.questao.possuiComentario;
				vm.comentarioSolicitado = vm.questao.solicitouComentarioTexto;
				break;
			case 'ia':
				vm.mostrarSolicitar = !vm.questao.possuiComentarioIA;
				vm.comentarioSolicitado = vm.questao.solicitouComentarioIA;
				break;
			case 'video':
                vm.mostrarSolicitar = vm.assinanteAvancado && !vm.questao.possuiComentarioVideo;
                vm.comentarioSolicitado = vm.questao.solicitouComentarioVideo;
                break;
			default:
				vm.mostrarSolicitar = false;
				vm.comentarioSolicitado = false;
		}
	}

	function solicitarComentario() {
		tec.apiPost("/questoes/" + vm.idQuestao + "/comentario/" + vm.tipoComentario.toUpperCase() + "/solicitar", {})
			.then(function() {
				switch (vm.tipoComentario) {
        			case 'texto':
        				vm.questao.solicitouComentarioTexto = true;
        				break;
        			case 'ia':
        				vm.questao.solicitouComentarioIA = true;
        				break;
        			case 'video':
        				vm.questao.solicitouComentarioVideo = true;
        				break;
        		}

        		vm.comentarioSolicitado = true;
			});
	}

	function buscarComentario() {
		var url = "/questoes/" + vm.idQuestao + "/comentario";

		if (vm.tipoComentario == "video") {
			url += "-video";
		} else if (vm.tipoComentario == "ia") {
			url += "-ia";
		} 

		if(vm.possuiToken) {
			url += "/" + vm.tokenPreVisualizacao;
		}

		var paramsGet = { tokenPreVisualizacao: vm.tokenPreVisualizacao };

		tec.apiGet(url, paramsGet)
		.then(function(data) {
			$scope.$evalAsync(function() {
				if (vm.tipoComentario == "video") {
					tratarComentarioVideo(data);
				} else {
					tratarComentario(data);
				}

				vm.terminouCarregar = true;
			});
		}).catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de comentários grátis por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");

				$scope.$evalAsync(function() {
					 $scope.$parent.vm.fecharComplemento();
				});
			}
		});
	}
	
	function setSessao(idCaderno, sessao) {
		localStorage.setItem(idCaderno + "["+userId+"]", JSON.stringify(sessao));
	}
	
	function getAlternativa(indice) {
		if (vm.questao.alternativas.length > 2) {
			return vm.alternativasME[indice];
		} else {
			if (indice == 0) {
				return "C";
			} else if (indice == 1) {
				return "E";
			}			
		}
		return;
	}
	
	function isAlternativaSelecionada(indice) {
		if (vm.questao.alternativaSelecionada) {
			return vm.questao.alternativaSelecionada - 1 == indice;
		}
		return false;
	}

	
	function isLogado() {
		return tec.isLogado();
	}
	
	
	function riscarAlternativa(indice) {
		return (vm.questao.alternativasClicadas[indice] > 0 && Math.abs(vm.questao.alternativasClicadas[indice] % 2) == 0 );
	}
	
	function limparAlternativasRiscadas() {
		for (i = 0; i < 5; i++) {
			vm.questao.alternativasClicadas[i] = 0;
		}
	}
	
	function buscarDescricaoDaAlternativa (posicao) {
		var i = posicao - 1;
		if (vm.questao.tipoQuestao == 'MULTIPLA_ESCOLHA') {
			return vm.alternativasME[i];
		} else {
			return vm.questao.alternativas[i];
		}
	}
	
	
	function sincronizarDadosDoCaderno(data) {
		if (!vm.caderno) {
			return;
		}
		// Finalizar caderno caso tenha terminado questoes em branco
		if (vm.questao.cadernoFinalizado == true && (vm.caderno.finalizado != vm.questao.cadernoFinalizado)) {
			vm.caderno.finalizado = true;
			vm.relogio.finalizado = true;
			tecDadosQuestao.finalizarCaderno(vm.caderno.idCaderno);
		}
		
		// Atualizar questoes marcadas
		var numero = parseInt(vm.questao.numeroQuestoesMarcadas);
		if (numero == 0) {
			vm.textoQuestoesMarcadas = null;
		} else if (numero == 1) {
			vm.textoQuestoesMarcadas = numero + " questão assinalada mas não resolvida"
		} else {
			vm.textoQuestoesMarcadas = numero + " questões assinaladas mas não resolvidas"
		}

		// botão proxima favorita
		vm.caderno.botaoFavoritaHabilitado = false;
		if (vm.caderno.listaFavoritas && vm.caderno.listaFavoritas.length > 1) {
			vm.caderno.botaoFavoritaHabilitado = true;
		} else if (vm.caderno.listaFavoritas && vm.caderno.listaFavoritas.length === 1 && vm.caderno.listaFavoritas[0] != vm.questao.idQuestao) {
			vm.caderno.botaoFavoritaHabilitado = true;
		}
		//

		// botão proxima anotada
		vm.caderno.botaoAnotadaHabilitado = false;
		if (vm.caderno.listaAnotadas && vm.caderno.listaAnotadas.length > 1) {
			vm.caderno.botaoAnotadaHabilitado = true;
		} else if (vm.caderno.listaAnotadas && vm.caderno.listaAnotadas.length === 1 && vm.caderno.listaAnotadas[0] != vm.questao.idQuestao) {
			vm.caderno.botaoAnotadaHabilitado = true;
		}
	}

	function exibirAlertaInvestidaCompleta() {
		var mostrar = localStorage.getItem("tec.exibirAnimacaoInvestida" + "["+userId+"]") === "true";
		if(mostrar) {
			confetti({
			  particleCount: 100,
			  spread: 70,
			  origin: { y: 0.6 }
			});				
		}

		Toastify({
		  text: "🎉 Parabéns, você completou a investida de hoje!",
		  duration: 3500,
		  gravity: "top", // `top` or `bottom`
		  position: "right", // `left`, `center` or `right`
		  stopOnFocus: true, // Prevents dismissing of toast on hover
		  className: "info"
		}).showToast();
	}

	//https://tecconcursos.atlassian.net/browse/TEC-2485
	//Alteração no iframe do caderno - enviar mensagem da questão e resolução para a janela pai
	function postMessageComResolucaoQuestao(data){
		var acertou;
		var idQuestao;
		if (data.questao) {
			idQuestao = data.questao.idQuestao;
			acertou = data.questao.alternativaSelecionada == data.questao.numeroAlternativaCorreta;
		} else {
			idQuestao = data.resolucao.idQuestao;
			acertou = data.resolucao.acertou;
		}
		var message = 'resolucao;'+ idQuestao + ';' + acertou;
		window.parent.postMessage(message, "*");
		return data;
	}

	function resolverQuestao() {
		if (vm.caderno && vm.relogio) {
			resolverQuestaoCaderno();
		} else if (vm.caderno && !vm.relogio) {
			resolverQuestaoCadernoAberto();
		} else {
			resolverQuestaoSemCaderno();			
		}
	}
	
	function resolverQuestaoCadernoAberto() {
		vm.aguardandoResolucao = true;

		var idCaderno = vm.caderno.idCaderno;
		var sessao = getSessao(idCaderno);

		if(vm.config.filtrarQuestoes && vm.questao.hash) {
			vm.caderno.cadernoHash = vm.questao.hash;
		}

		var params = {
			requestId: "resolver-questao-caderno-aberto",
			id: vm.caderno.idCaderno,
			idQuestao: vm.questao.idQuestao,
			alternativaSelecionada: vm.questao.alternativaSelecionada,
			cadernoHash: vm.caderno.cadernoHash
		};

		tecDadosQuestao.resolucaoCadernoAberto(params)
		.then(vm.postMessageComResolucaoQuestao)
		.then(function (data) {
			if (data.error) {
				exibirMensagemLimiteAtingido();
			} else {
				vm.questao.numeroAlternativaCorreta = data.resolucao.alternativa;
				vm.questao.correcaoQuestao = data.resolucao.acertou;

				if (data.resolucao.conquistouInvestida) {
					vm.questao.conquistouInvestida = true;
					exibirAlertaInvestidaCompleta();
				}

				if (vm.questao.correcaoQuestao) {
					sessao.acertos = Number(sessao.acertos) + 1;
				} else {
					sessao.erros = Number(sessao.erros) + 1;
				}
				if (!sessao.questoes) {
					sessao.questoes = {};
				}
				sessao.questoes[vm.questao.idQuestao] = {
						selecionada: vm.questao.alternativaSelecionada,
						correta: data.resolucao.alternativa,
						acertou: data.resolucao.acertou
				};

				sessao.resolvidas = Number(sessao.resolvidas) + 1;
				setSessao(idCaderno, sessao);
			}
		})
		.then(vm.limparAlternativasRiscadas)
		.then(function() {
			vm.aguardandoResolucao = false;
		})
		.catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}

			vm.aguardandoResolucao = false;
		});
	}
	
	function resolverQuestaoSemCaderno() {
		var params = { alternativa: vm.questao.alternativaSelecionada, questaoAdaptadaOuInedita: vm.questao.questaoAdaptadaOuInedita };
		if(vm.questao.formatoQuestao == 'DISCURSIVA') {
			params.correcaoQuestao = true;
		}

		tecDadosQuestao.alterarQuestao(vm.questao.idQuestao, params)
		.then(vm.callbackCarregarQuestaoSemScroll)
		.then(function() {
			if (vm.questao.conquistouInvestida) {
				exibirAlertaInvestidaCompleta();
			}
		})
		.then(function() {
			if (vm.manterResolucao) {
				var sessao = getSessao(vm.pastaAtual);
				if (!sessao.questoes) {
					sessao.questoes = {};
				}
				sessao.questoes[vm.questao.idQuestao] = {
						selecionada: vm.questao.alternativaSelecionada,
						correta: vm.questao.numeroAlternativaCorreta,
						acertou: vm.questao.numeroAlternativaCorreta == vm.questao.alternativaSelecionada
				};

				setSessao(vm.pastaAtual, sessao);
			}

		})
		.then(limparAlternativasRiscadas)
		.catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}
		});
	}
	
	function resolverQuestaoCaderno() {
		vm.aguardandoResolucao = true;

		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			resolver: true,
			atualizarCronometro: !vm.relogio.pausa,
			questaoAdaptadaOuInedita: vm.questao.questaoAdaptadaOuInedita,
			requestId: "alterar-questao-atual-caderno",
			resolvida: false
		};

		tecDadosQuestao.alterarQuestaoAtualCaderno(vm.caderno.idCaderno, params)
		.then(vm.postMessageComResolucaoQuestao)
		.then(vm.callbackCarregarQuestaoSemScroll)
		.then(function() {
        	if (vm.questao.conquistouInvestida) {
        		exibirAlertaInvestidaCompleta();
        	}
        })
		.then(vm.sincronizarDadosDoCaderno)
		.then(vm.limparAlternativasRiscadas)
		.then(function() {
			vm.aguardandoResolucao = false;
		})
		.catch(function(data) {
			if ((typeof data === 'string' || data instanceof String) && data.includes("duplicada")) {
			} else if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}

			vm.aguardandoResolucao = false;
		});
	}
	
		// private
	function getSessao(idCaderno) {
		var sessaoObj = localStorage.getItem(idCaderno + "["+userId+"]");
		if (!sessaoObj) {
			var sessao = {acertos: 0, erros: 0, resolvidas: 0};
			return sessao;
		} else {
			var sessao = JSON.parse(sessaoObj);
			return sessao;
		}
	}


	function selecionarAlternativa(alternativa) {
		vm.atualizarAlternativa = true;
		var cliques = vm.questao.alternativasClicadas[alternativa];
		
		if (cliques > 0) {
			vm.questao.alternativasClicadas[alternativa] = ++cliques;
			// se for par
			if (Math.abs(cliques % 2) == 0) {
				vm.questao.alternativaSelecionada = null;
			}
			
		} else {
			// numero de clicks impar volta pra zero
			for (i = 0; i < 5; i++) {
				if (Math.abs(vm.questao.alternativasClicadas[i] % 2) != 0) {
					vm.questao.alternativasClicadas[i] = 0;
				}
			}
			vm.questao.alternativasClicadas[alternativa] = 1;
			vm.questao.alternativaSelecionada = alternativa + 1;
		}
	}

	function resolverQuestaoIneditaOuAdaptada() {
		if(vm.questao.assinanteAvancado) {
			resolverQuestao();
		}
	}
	
		
	function mostrarTextoAssociado() {
		var textoAssociadoLink = $(".link-textoassociado");

		textoAssociadoLink.on('click', function() {
			var mostrarTextoAssociado = textoAssociadoLink.hasClass("collapsed");
			$.atualizarConfiguracaoUsuarioLocalStorage("mostrarTextoAssociado" + "["+userId+"]", mostrarTextoAssociado);
		});

		$.obterValorConfiguracaoUsuario("mostrarTextoAssociado" + "["+userId+"]")
		.then(function(mostrar) {
			if(mostrar) {
				textoAssociadoLink.removeClass("collapsed");
				var textoAssociado = $(".textoassociado");
				textoAssociado.addClass("in");
			}
		});
	}

	
	function alertaResolverQuestaoIneditaOuAdaptada() {
		tec.alert('Para resolver esta questão é necessário possuir o Plano Avançado.', 'Questão adaptada / inédita');
	}
	
	function verificarResolucao(alternativa) {
		if (vm.questao.correcaoQuestao != null) {
			if (alternativa == vm.questao.numeroAlternativaCorreta && vm.questao.numeroAlternativaCorreta == vm.questao.alternativaSelecionada) {
				return "acerto";
			} else if (alternativa == vm.questao.numeroAlternativaCorreta) {
				return "correcao";
			} else if (alternativa == vm.questao.alternativaSelecionada) {
				return "erro";
			}
		}
		return "";
	}
	
	function verificarAlternativaGabarito(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao == "acerto" || resolucao == "correcao";
	}
	
	function verificarAlternativaErro(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao == "erro";
	}
	
	function verificarAlternativaSemMarcacao(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao != "acerto" && resolucao != "correcao" && resolucao != "erro";
	}

	function mostrarAlertaExclusivoParaAssinantes() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	}
	function mostrarAlertaExclusivoParaAssinanteAvancado() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do Plano Avançado.", "Recurso exclusivo do Plano Avançado");
	}
	
	function gerarCelebracaoAleatoria() {
		var celebracoes = ["Parabéns!", "Muito bem!", "Continue assim!", "Mandou bem!", "Boa!"];
		return celebracoes[Math.floor(Math.random() * celebracoes.length)];
	}


	function callbackCarregarQuestaoSemScroll(data) {
		callbackCarregarQuestao(data, true);
	}
	
	function zerarFormularioNotificacao() {
		vm.tipoErro = null;
		vm.subTipoErro = null;
		vm.abrirReportErro = false;
		vm.descricaoErro = "";
		vm.msgPreencherDetalheErro = false;
	}


	function callbackCarregarQuestao(data, impedirScroll) {
		$scope.$evalAsync(function() {
			tec.habilitarSelecao();
			// força propagação para controller TecQuestaoCadernoController...
			for (var property in data.questao) {
				vm.questao[property] = data.questao[property];
			}
			if (!vm.questao) {
				return null;
			}

			vm.carregrQuestaoAcabou = true;

			if(vm.token != null) {
				vm.questao.possuiComentario = true;
			}

			vm.tipoComentarioAtivo = !vm.questao.possuiComentario && vm.questao.possuiComentarioVideo && $.isAssinanteAvancadoLogado() ? vm.tipoComentario.VIDEO : vm.tipoComentario.TEXTO;

			vm.celebracaoAleatoria = gerarCelebracaoAleatoria();
			vm.questao.temAnotacao = vm.questao.anotacao && vm.questao.anotacao.length;

			$timeout(function() {

				mostrarTextoAssociado();

				if (!impedirScroll) {
					vm.scrollSeNecessario();
				}
				$(window).scroll();
				vm.zerarFormularioNotificacao();
			});
		});
	}
	
	function buscarSomenteDadosDoComentario() {
		// buscar a foto do professor
		var paramsGet = { tokenPreVisualizacao: vm.tokenPreVisualizacao };
		var url = "/questoes/" + vm.idQuestao + "/dados-do-comentario";

		if (vm.tipoComentario == "video") {
			url += "-video";
		} else if (vm.tipoComentario == "ia") {
			url += "-ia";
		} 

		tec.apiGet(url, paramsGet)
		.then(function(data) {
			$scope.$evalAsync(function() {
				vm.comentario = data.comentario;

				vm.terminouCarregar = true;
			});
		});
	}

	function buscarComentarioParaCadernoAberto(idCaderno) {
		// buscar a foto do professor
		var params = { cadernoHash: vm.cadernoHash };
		var url = "/caderno-aberto/" + idCaderno + "/questao/" + vm.idQuestao + "/comentario";

		if (vm.tipoComentario == "video") {
			url += "-video";
		}	else if (vm.tipoComentario == "ia") {
			url += "-ia";
		} 

		tec.apiPost(url, params)
		.then(function(data) {
			$scope.$evalAsync(function() {
				vm.comentario = data.comentario;

				if (vm.tipoComentario == "video") {
					tratarComentarioVideo(data);
				}

				vm.terminouCarregar = true;
			});
		});
	}
	
	function tratarComentario(data) {
		if (data.comentario.textoComentario) {
			var texto = data.comentario.textoComentario.replace(/54[.]232[.]113[.]178/gi, '52.67.112.46');
			data.comentario.textoComentario =  "<div>" + texto + "</div>";
			var conteudo = $(data.comentario.textoComentario);
			var links = conteudo.find("a");
			if(links.size() > 0) {
				links.each(function(index, value) {
					var html = $(this).html();
					if(html.length > 70) {
						$(this).html(html.substring(0, 47) + "...");
					}
				});
			}
			data.comentario.textoComentario = conteudo;
			vm.comentario = data.comentario;
			//$("#linkProfessorId").focus();
		}
	}

	function tratarComentarioVideo(data) {
		
		if (!data || !$.isAssinanteAvancadoLogado()) {
			return;
		}
		
		data.comentario.temVideo = !!data.comentario.textoComentario;

		if (data.comentario.temVideo) {
			var url = data.comentario.textoComentario;
			if ($.isYoutubeVideo(url)) {
				url += '?enablejsapi=1&origin=' + window.location.origin;
			}
			data.comentario.urlVideo = $sce.trustAsResourceUrl(url);
		}

		vm.comentario = data.comentario;
		//$("#linkProfessorId").focus();
	}
	
	function avaliarComentario(nota) {
		if (isProfessor) {
			tec.alert("Professor logado na área do aluno não pode avaliar comentários de professores.", "Recurso bloqueado para professor");
			return;
		}

		var url = "/questoes/" + vm.idQuestao + "/avaliar-comentario";

		if (vm.tipoComentario == "video") {
			url += "-video";
		} else if (vm.tipoComentario == "ia") {
			url += "-ia";
		}

		vm.comentario.notaComentario = nota;
		var params = {
			idQuestao: vm.idQuestao,
			nota: nota,
			requestId: "avaliar-comentario"
		};
		tec.apiPut(url, params);
	}
}

module.controller("TecQuestaoComentarioCtrl", TecQuestaoComentarioCtrl);

module.directive("tecQuestaoBanca", function() {
	return {
		restrict: "A",
		scope: {
			params: "&tecQuestaoBanca"
		},
		templateUrl: "questao-banca-directive",
		controller: "TecQuestaoBancaCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			var params = scope.params();
			ctrl.buscarConteudo(params.questao, params);
		}
	};
});
module.controller("TecQuestaoBancaCtrl", function($scope, tec) {
	var vm = this;
	vm.buscarConteudo = function(questao, params) {
		vm.usuarioGratis = params.usuarioGratis;

		if (!vm.usuarioGratis) {
			var paramsGet = { tokenPreVisualizacao: params.tokenPreVisualizacao };
			tec.apiGet("/questoes/" + questao.idQuestao + "/resolucao-banca", paramsGet)
			.then(function(data) {
				$scope.$evalAsync(function() {
					vm.resolucaoDaBanca = data.resolucaoDaBanca;
				});
			});
		}
	};
});

module.directive("tecQuestaoDetalhes", function() {
	return {
		restrict: "A",
		scope: {
			params: "&tecQuestaoDetalhes"
		},
		templateUrl: "questao-detalhes-directive",
		controller: "TecQuestaoDetalhesCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			var params = scope.params();
			ctrl.buscarConteudo(params);
		}
	};
});

module.controller("TecQuestaoDetalhesCtrl", function($scope, $location, tec, tecDadosQuestao) {
	var vm = this;
	vm.buscarConteudo = buscarConteudo;
	vm.buscarDetalhes = buscarDetalhes;
	
	function buscarConteudo(params) {
		vm.caderno = {};
		if (params.caderno) {
			vm.caderno = params.caderno;
		}
		vm.questao = params.questao;
		vm.deslogado = params.deslogado;
		vm.buscarDetalhes();
	}

	function buscarDetalhes() {
		if(!vm.deslogado) {
			tec.apiGet("/questoes/" + vm.questao.idQuestao + "/detalhes")
			.then(function(data) {
				$scope.$evalAsync(function() {
					vm.detalhes = data.informacoes;
					vm.detalhes.questaoObjetiva = (vm.questao.formatoQuestao == "OBJETIVA");
					vm.detalhes.questaoDiscursiva = (vm.questao.formatoQuestao == "DISCURSIVA");
				});
			});
		} else {
			if (vm.caderno.cadernoAberto === true) {
				var params = {cadernoHash: vm.caderno.cadernoHash};
				
				tec.apiPost("/caderno-aberto/" + vm.caderno.idCaderno + "/questao/" + vm.questao.idQuestao + "/detalhes", params)
				.then(function(data) {
					$scope.$evalAsync(function() {
						vm.detalhes = data.informacoes;
						vm.detalhes.questaoObjetiva = (vm.questao.formatoQuestao == "OBJETIVA");
						vm.detalhes.questaoDiscursiva = (vm.questao.formatoQuestao == "DISCURSIVA");
					});
				});
				
			}
		}
	}
});

module.directive("tecQuestaoDesempenho", function() {
	return {
		restrict: "A",
		scope: {
			params: "&tecQuestaoDesempenho"
		},
		templateUrl: "questao-desempenho-directive",
		controller: "TecQuestaoDesempenhoCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			var params = scope.params();
			ctrl.buscarConteudo(params);
		}
	};
});

module.controller("TecQuestaoDesempenhoCtrl", function($scope, $location, tec, tecDadosQuestao) {
	var vm = this;
	vm.buscarConteudo = buscarConteudo;
	vm.buscarDesempenho = buscarDesempenho;

	vm.chaveEsconderAlternativas = 'tec.questaoDesempenhoEsconderAlternativas';
	vm.esconderAlternativas = false;
	vm.toggleEsconderAlternativas = toggleEsconderAlternativas;

	vm.dadosGraficosAlternativas = [];

	vm.graficos = {
		geral: {
			mostrar: true,
			dados: [],
			descricao: "",
		},
		alternativas: {
			mostrar: true,
			dados: [],
			dadosZerados: [],
			descricao: "Distribuição das alternativas marcadas",
			cores: [],
			labels: [],
			options: {
				scales: {
					yAxes: [{
						ticks: {
							precision: 0,
							beginAtZero: true
						},
					}],
				},
			},
		},
		aluno: {
			mostrar: true,
			dados: [],
			descricao: "",
		},
	}

	function buscarConteudo(params) {
		vm.caderno = {};
		if (params.caderno) {
			vm.caderno = params.caderno;
		}
		vm.questao = params.questao;
		vm.idQuestao = vm.questao.idQuestao;
		vm.deslogado = params.deslogado;
		vm.detalhes = {};
		vm.buscarDesempenho();

		var esconderAlternativas = JSON.parse(localStorage.getItem(vm.chaveEsconderAlternativas + "["+userId+"]"));

		if (typeof esconderAlternativas === 'boolean') {
			vm.esconderAlternativas = esconderAlternativas;
		}
	}

	function toggleEsconderAlternativas() {
		vm.esconderAlternativas = !vm.esconderAlternativas;

		vm.dadosGraficosAlternativas = vm.esconderAlternativas ?
			vm.graficos.alternativas.dadosZerados : vm.graficos.alternativas.dados

		localStorage.setItem(vm.chaveEsconderAlternativas + "["+userId+"]", JSON.stringify(vm.esconderAlternativas));
	}

	function buscarDesempenho() {
		if(!vm.deslogado) {
			tec.apiGet("/questoes/" + vm.questao.idQuestao + "/desempenho")
			.then(function(data) {
				$scope.$evalAsync(function() {
					vm.alternativaCorreta = data.desempenho.alternativaCorreta;
					vm.dificuldade = data.desempenho.dificuldade;

					vm.desempenhoGeral = data.desempenho.desempenhoGeral;
					calcularDesempenhoGeral();

					vm.desempenhoAluno = data.desempenho.desempenhoAluno;
					calcularDesempenhoAluno();
				});
			}).catch(function(erro) {
				console.log("Erro: " + erro);
			});
		} else {
			vm.graficos.geral.mostrar = false;
            vm.graficos.alternativas.mostrar = false;
            vm.graficos.aluno.mostrar = false;
		}
	}

	// private functions
	function calcularDesempenhoGeral() {
		if (!vm.desempenhoGeral) {
			vm.graficos.geral.mostrar = false;
			vm.graficos.alternativas.mostrar = false;
			return;
		}

		var acertos = vm.desempenhoGeral.acertos;
        var erros = vm.desempenhoGeral.erros;

		var total = acertos + erros;

        if(total == 0) {
			vm.graficos.geral.mostrar = false;
			vm.graficos.alternativas.mostrar = false;
			return;
		}

		vm.graficos.geral.mostrar = true;

		var porcentagemAcertos = (100 * acertos) / total;
        var porcentagemErros = (100 * erros) / total;

        vm.desempenhoGeral.porcentagemAcertos = localizarPorcentagem(porcentagemAcertos);
        vm.desempenhoGeral.porcentagemErros = localizarPorcentagem(porcentagemErros);
        vm.desempenhoGeral.total = total;

		vm.graficos.geral.dados = [ acertos, erros ];
		vm.graficos.geral.descricao = "Desempenho geral na questão. Acertos: " + acertos + ", Erros: " + erros;

		var totalAlternativas =
			vm.desempenhoGeral.alternativa1 +
			vm.desempenhoGeral.alternativa2 +
			vm.desempenhoGeral.alternativa3 +
			vm.desempenhoGeral.alternativa4 +
			vm.desempenhoGeral.alternativa5;

		if(totalAlternativas == 0) {
			vm.graficos.alternativas.mostrar = false;
			return;
		}

		vm.desempenhoGeral.naoRegistrados = total - totalAlternativas;

		vm.desempenhoGeral.porcentagemAlternativa1 = localizarPorcentagem((100 * vm.desempenhoGeral.alternativa1) / totalAlternativas);
		vm.desempenhoGeral.porcentagemAlternativa2 = localizarPorcentagem((100 * vm.desempenhoGeral.alternativa2) / totalAlternativas);
		vm.desempenhoGeral.porcentagemAlternativa3 = localizarPorcentagem((100 * vm.desempenhoGeral.alternativa3) / totalAlternativas);
		vm.desempenhoGeral.porcentagemAlternativa4 = localizarPorcentagem((100 * vm.desempenhoGeral.alternativa4) / totalAlternativas);
		vm.desempenhoGeral.porcentagemAlternativa5 = localizarPorcentagem((100 * vm.desempenhoGeral.alternativa5) / totalAlternativas);

		if (vm.questao.alternativas.length > 2) {
			vm.graficos.alternativas.labels = ['A','B','C','D','E'];
			vm.graficos.alternativas.cores = ['#FC2D1E','#FC2D1E','#FC2D1E','#FC2D1E','#FC2D1E'];
			vm.graficos.alternativas.dados = [
				vm.desempenhoGeral.alternativa1,
				vm.desempenhoGeral.alternativa2,
				vm.desempenhoGeral.alternativa3,
				vm.desempenhoGeral.alternativa4,
				vm.desempenhoGeral.alternativa5
			];
			vm.graficos.alternativas.dadosZerados = [0, 0, 0, 0, 0];
		} else {
			vm.graficos.alternativas.labels = ['CERTO','ERRADO'];
			vm.graficos.alternativas.cores = ['#FC2D1E','#FC2D1E'];
			vm.graficos.alternativas.dados = [
				vm.desempenhoGeral.alternativa1,
				vm.desempenhoGeral.alternativa2
			];
			vm.graficos.alternativas.dadosZerados = [0, 0];
		}

		vm.dadosGraficosAlternativas = vm.esconderAlternativas ?
        	vm.graficos.alternativas.dadosZerados : vm.graficos.alternativas.dados

		vm.graficos.alternativas.cores[vm.alternativaCorreta - 1] = '#00B763';

		vm.desempenhoGeral.tempoFormatado = "--";
		if (!!vm.desempenhoGeral.tempoMedio) {
			vm.desempenhoGeral.tempoFormatado = formatarTempoResolucao(vm.desempenhoGeral.tempoMedio);
		}
	}

	function calcularDesempenhoAluno() {
		if (!vm.desempenhoAluno) {
			vm.graficos.aluno.mostrar = false;
			return;
		}

		var total = vm.desempenhoAluno.quantidadeAcertos + vm.desempenhoAluno.quantidadeErros;

		if(total == 0) {
			vm.graficos.aluno.mostrar = false;
			return
		}

		vm.desempenhoAluno.totalResolucoes = total;

		var acertos = vm.desempenhoAluno.quantidadeAcertos;
        var erros = vm.desempenhoAluno.quantidadeErros;

        var porcentagemAcertos = (100 * acertos) / total;
        var porcentagemErros = (100 * erros) / total;

        vm.graficos.aluno.mostrar = true;

		vm.desempenhoAluno.porcentagemAcertos = localizarPorcentagem(porcentagemAcertos);
		vm.desempenhoAluno.porcentagemErros = localizarPorcentagem(porcentagemErros);
		vm.graficos.aluno.dados = [ acertos, erros ];
		vm.graficos.aluno.descricao = "Seu desempenho na questão. Acertos: " + acertos + ", Erros: " + erros;

		for (i = 0; i < vm.desempenhoAluno.resolucoes.length; i++) {
			var resolucao = vm.desempenhoAluno.resolucoes[i];
			resolucao.alternativaSelecionada = calcularAlternativaSelecionada(resolucao.alternativa);

			if (!!resolucao.tempoResolucao && resolucao.tempoResolucao < 1800 /* não mostra se chegou no limte de 30min */) {
				resolucao.tempoFormatado = formatarTempoResolucao(resolucao.tempoResolucao);
			} else {
				resolucao.tempoFormatado = null;
			}
		}

		function calcularAlternativaSelecionada(alternativa) {
			if (alternativa >= 1 && alternativa <= 5) {
				return ["A", "B", "C", "D", "E"][alternativa - 1];
			} else {
				return "";
			}
		}
	}

	function localizarPorcentagem(porcentagem) {
		return porcentagem.toLocaleString('pt-BR', {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		}).replace(/,00$/, '');;
	}

	function formatarTempoResolucao(segundosTotal) {
		var minutos = Math.floor(segundosTotal / 60);
		var segundos = segundosTotal % 60;

		return (minutos >= 10 ? '' : '0') + minutos + (segundos >= 10 ? 'm' : 'm0') + segundos + "s";
	}
});

module.directive("tecQuestaoDiscussao", function() {
	return {
		restrict: "A",
		scope: {
			params: "&tecQuestaoDiscussao",
			ordenarPor: "=ordenarPor",
			mostrarFotoDeUsuarios: "=mostrarFotos",
			alterarOrdenacaoForum: "&",
			modoExibicaoForum: "=",
			questao: "=",
			relogio: "=",
			caderno: "=",
			questaoProximaFavorita: "&",
			questaoProximaAnotada: "&",
			desfazerUltimaQuestao: "&",
			questaoTopicoSeguinte: "&",
			questaoTopicoAnterior: "&",
			questaoNaoResolvida: "&",
			questaoAleatoria: "&",
			questaoSeguinte: "&",
			questaoAnterior: "&"
		},
		templateUrl: "questao-discussao-directive",
		controller: "TecQuestaoDiscussaoCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			var params = scope.params();
			ctrl.buscarConteudo(scope.questao, params, scope.ordenarPor, scope.mostrarFotoDeUsuarios, params.deslogado, scope.alterarOrdenacaoForum, scope.caderno, scope.relogio,
			scope.modoExibicaoForum, scope.questaoAnterior, scope.questaoSeguinte, scope.questaoAleatoria, scope.questaoNaoResolvida, scope.questaoTopicoAnterior,
			scope.questaoTopicoSeguinte, scope.desfazerUltimaQuestao, scope.questaoProximaFavorita, scope.questaoProximaAnotada);
		}
	};
});

module.controller("TecQuestaoDiscussaoCtrl", function($scope, $timeout, $sce, tec, tecDadosQuestao) {
	var vm = this;
	vm.ordenarPor = null;
	vm.paginaAtual = 1;
	vm.proximaPagina = proximaPagina;
	vm.mostrarFotoDeUsuarios = null;
	vm.buscarConteudo = buscarConteudo;
	vm.acompanharQuestao = acompanharQuestao;
	vm.alterarOrdenacao = alterarOrdenacao;
	vm.aceitarTermosForum = aceitarTermosForum;
	vm.votarComentarioAprovar = votarComentarioAprovar;
	vm.votarComentarioRejeitar = votarComentarioRejeitar;
	vm.publicarComentario = publicarComentario;
	vm.publicarComentarioHTML = publicarComentarioHTML;
	vm.adicionarComentario = adicionarComentario;
	vm.abrirEditor = abrirEditor;
	vm.editarComentario = editarComentario;
	vm.apagarComentario = apagarComentario;
	vm.notificarAlteracaoComentario = notificarAlteracaoComentario;
	vm.apelidoNaoPermitido = false;
	vm.apelidoJaExiste = apelidoJaExiste;
	vm.deslogado = false;
	vm.questaoAdaptadaOuInedita = false;
	vm.assinanteAvancado = false;
	vm.carregarInformacoesDoAluno = carregarInformacoesDoAluno;
	vm.silenciarDono = silenciarDono;
	vm.bloquearDono = bloquearDono;
	vm.desfazerSilenciar = desfazerSilenciar;
	vm.carregarPagina = carregarPagina;
	vm.possuiVotoComentario = false;

	vm.questao = null;
	vm.getAlternativa = getAlternativa;
	vm.isAlternativaSelecionada = isAlternativaSelecionada;
	vm.riscarAlternativa = riscarAlternativa;
	vm.limparAlternativasRiscadas = limparAlternativasRiscadas;
	vm.resolverQuestao = resolverQuestao;
	vm.resolverQuestaoIneditaOuAdaptada = resolverQuestaoIneditaOuAdaptada;
	vm.alertaResolverQuestaoIneditaOuAdaptada = alertaResolverQuestaoIneditaOuAdaptada;
	vm.verificarResolucao = verificarResolucao;
	vm.verificarAlternativaGabarito = verificarAlternativaGabarito;
	vm.verificarAlternativaErro = verificarAlternativaErro;
	vm.verificarAlternativaSemMarcacao = verificarAlternativaSemMarcacao;
	vm.mostrarAlertaExclusivoParaAssinantes = mostrarAlertaExclusivoParaAssinantes;
	vm.mostrarAlertaExclusivoParaAssinanteAvancado = mostrarAlertaExclusivoParaAssinanteAvancado;
	vm.gerarCelebracaoAleatoria = gerarCelebracaoAleatoria;
	vm.alternativasME = ["A", "B", "C", "D", "E"];
	vm.selecionarAlternativa = selecionarAlternativa;
	vm.callbackCarregarQuestaoSemScroll = callbackCarregarQuestaoSemScroll;
	vm.callbackCarregarQuestao = callbackCarregarQuestao;
	vm.mostrarTextoAssociado = mostrarTextoAssociado;
	vm.zerarFormularioNotificacao = zerarFormularioNotificacao;
	vm.buscarDescricaoDaAlternativa = buscarDescricaoDaAlternativa;
	vm.postMessageComResolucaoQuestao = postMessageComResolucaoQuestao;
	vm.sincronizarDadosDoCaderno = sincronizarDadosDoCaderno;
	vm.modoExibicaoComentario = { codigo: "ACIMA", descricao: "Acima", icone: "acima" }; // default
	vm.telaDesktop = window.screen.width > 1200;
	vm.setSessao = setSessao;

	function buscarConteudo(questao, params, ordenarPor, mostrarFotoDeUsuarios, deslogado, alterarOrdenacaoForum, caderno, relogio,
			modoExibicaoForum, questaoAnterior, questaoSeguinte, questaoAleatoria, questaoNaoResolvida, questaoDoTopicoAnterior,
			questaoDoTopicoSeguinte, desfazerUltimaQuestao, questaoProximaFavorita, questaoProximaAnotada) {
		vm.questao = questao;
		vm.ordenarPor = !!ordenarPor ? ordenarPor.toLowerCase() : "data"
		vm.mostrarFotoDeUsuarios = mostrarFotoDeUsuarios;
		if (deslogado) {
			vm.deslogado = deslogado;
			vm.questao.aceitouTermosForum = true;
		}
		vm.questaoAdaptadaOuInedita = questao.questaoAdaptadaOuInedita;
		vm.assinanteAvancado = questao.assinanteAvancado;
		vm.carregarInformacoesDoAluno();
		vm.alterarOrdenacaoForum = alterarOrdenacaoForum;
	   	vm.relogio = relogio;
	   	
		vm.usuarioGratis = params.usuarioGratis;
		vm.deslogado = params.deslogado;
		vm.questaoAdaptadaOuInedita = questao.questaoAdaptadaOuInedita;
		vm.tokenPreVisualizacao = params.tokenPreVisualizacao;
		vm.possuiToken = params.tokenPreVisualizacao != null && params.tokenPreVisualizacao != ""
	   	
		vm.cadernoQuestoes = params.cadernoQuestoes;
		vm.exibirBotoesTrocarTopico = params.exibirBotoesTrocarTopico;
		
		vm.navegacao = params.navegacao;
		vm.ocultarNavegacao = params.ocultarNavegacao;
		
		vm.navegacaoAvancada = params.navegacaoAvancada;
		
		vm.config = params.config;
		
		if (vm.config) {
			vm.questoes = vm.config.questoes;			
		}
	
		vm.botaoDesfazerHabilitado = params.botaoDesfazerHabilitado;
	   	
		vm.telaDesktop = window.screen.width > 1200;
		
		vm.questaoAnterior = questaoAnterior;
		vm.questaoSeguinte = questaoSeguinte;
		
		vm.questaoAleatoria = questaoAleatoria;
		vm.questaoNaoResolvida = questaoNaoResolvida;
		
		vm.questaoDoTopicoAnterior = questaoDoTopicoAnterior;
		vm.questaoDoTopicoSeguinte = questaoDoTopicoSeguinte;
		
		vm.desfazerUltimaQuestao = desfazerUltimaQuestao;
		vm.questaoProximaFavorita = questaoProximaFavorita;
		vm.questaoProximaAnotada = questaoProximaAnotada;

	   	vm.modoExibicaoForum = modoExibicaoForum;

		var modoExibicaoForumSalvo = localStorage.getItem("tec.modoExibicaoForum" + "["+userId+"]");
		 
		if (modoExibicaoForumSalvo) {
			if (modoExibicaoForumSalvo == 'ACIMA') {
				vm.modoExibicaoForum.codigo = "ACIMA";
				vm.modoExibicaoForum.descricao = "Acima";
				vm.modoExibicaoForum.icone = "acima";
			} else if (modoExibicaoForumSalvo == 'ABAIXO') {
				vm.modoExibicaoForum.codigo = "ABAIXO";
				vm.modoExibicaoForum.descricao = "Abaixo";
				vm.modoExibicaoForum.icone = "abaixo";
			} else if (modoExibicaoForumSalvo = "AO_LADO") {
				vm.modoExibicaoForum.codigo = "AO_LADO";
				vm.modoExibicaoForum.descricao = "Ao lado";
				vm.modoExibicaoForum.icone = "ao-lado";
			}
		}

		if (modoExibicaoForumSalvo == 'ABAIXO') {
			$timeout(function(){ $(".questao-complementos")[0].scrollIntoView({ behavior: "smooth" }); });
		}
	   	
		if (caderno) {
			vm.cadernoAberto = caderno.cadernoAberto;
			vm.idCaderno = caderno.idCaderno
			vm.caderno = caderno;

			if (vm.cadernoAberto) {
				vm.cadernoHash = caderno.cadernoHash;
			}
		}


	}
	
	function acompanharQuestao(acompanhar) {
		tec.apiPut("/questoes/" + vm.questao.idQuestao + "/acompanhamento", { acompanhar: acompanhar })
		.then(function(data) {
			vm.questao.acompanhar = data.boolean;
		});
	}
	
	function alterarOrdenacao(ordenarPor) {
		var param = { ordenacaoForum: ordenarPor };
		tec.apiPut("/alunos/aluno-logado/alterar-ordenacao-forum", param)
		.then(function(data) {
			$.atualizarConfiguracaoUsuarioLocalStorage("ordenacaoForum", ordenarPor);
			vm.ordenarPor = ordenarPor;
			inicializar();
			//para persistir quando abrir novamente o forum sem recarregar
			vm.alterarOrdenacaoForum({ordenar: ordenarPor});
		});
	}
	
	function carregarInformacoesDoAluno() {
		if (!vm.questao.aceitouTermosForum) {
			tec.apiGet("alunos/aluno-logado/apelido")
			.then(function(data) {
				if (!data) {
					data = ""
				}
				vm.apelidoForum = data;
			});
		}
		inicializar();
	}
	
	function aceitarTermosForum() {
		tec.apiPost("/discussoes/termos-de-uso", { aceitar: true, apelido: vm.apelidoForum })
		.then(function() {
			vm.questao.aceitouTermosForum = true;
			tec.scroll(".questao-complementos");
		});
	}
	
	function votarComentarioAprovar(comentario) {
		votarComentario(comentario, "UP");
	}
	
	function votarComentarioRejeitar(comentario) {
		votarComentario(comentario, "DOWN");
	}
	
	function publicarComentario() {
		tec.apiGet("/discussoes/usuario-suspenso")
		.then(function(data) {
			var usuarioSuspenso = data.usuarioSuspenso
			if (usuarioSuspenso.suspenso) {
				$.alerts.alert("Sua conta está impedida de postar no fórum de " +
						"questões até o dia " + usuarioSuspenso.liberacao + " por violar os termos de uso. " +
						"Após esta data você poderá voltar a postar.");
			} else {
				if (!vm.comentarioEdicao.texto || vm.comentarioEdicao.texto == "") {
					$.alerts.alert("Não é possível publicar um comentário vazio.");
				} else {
					var chamadaApi = tec.apiPost;
					var url = montarUrlDiscussao();
					vm.comentarioEdicao.texto = tec.trimHtml(vm.comentarioEdicao.texto);
					vm.comentarioEdicao.texto = tec.removeLinks(vm.comentarioEdicao.texto);
					
					if (!vm.comentarioEdicao.texto || vm.comentarioEdicao.texto == "") {
						$.alerts.alert("Não foi possível publicar seu comentário. Após realizar formatação o mesmo ficou sem nenhum caractere válido.");
						return;
					}
					
					var novoComentario = true;
					if (vm.comentarioEdicao.id) {
						chamadaApi = tec.apiPut;
						url += "/" + vm.comentarioEdicao.id;
						novoComentario = false;
					}

					chamadaApi(url, vm.comentarioEdicao)
					.then(function(data) {
						if (!data.comentarioAlunoDto && !data.comentarioAluno){
							tec.alert(data.string, 'Aviso');
						} else {
							if (novoComentario) {
									carregarFotoDeUsuarios([data.comentarioAlunoDto]);
									verificarLinksYouTube([data.comentarioAlunoDto]);
									vm.comentarios.push(data.comentarioAlunoDto);
							} else {
								for (var i = 0; i < vm.comentarios.length; i++) {
									if (vm.comentarios[i].id == data.comentarioAluno.id) {
										vm.comentarios[i].comentario = data.comentarioAluno.comentario;
										verificarLinksYouTube([vm.comentarios[i]]);
									}
								}
							}
							vm.comentarioEdicao = null;
						}
					});
				}
			}
		});
	}
	
	function proximaPagina() {
		vm.paginaAtual++;
		vm.carregarPagina(vm.paginaAtual);
	}

	function abrirEditor() {
		if (!$.isLogado()) {
			mostrarAlertaExclusivoParaLogados();
			return;
		}
		vm.comentarioEdicao = {};
	}

	function publicarComentarioHTML() {
		vm.comentarioEdicao.formato = 'HTML';
		publicarComentario();
	}
	
	function adicionarComentario() {
		abrirEditor();
		notificarAlteracaoComentario();
	}
	
	function editarComentario(comentario) {
		if (!vm.comentarioEdicao) {			
			tec.apiGet("/discussoes/comentarios-sem-formatacao/" + comentario.id, { idComentario: comentario.id })
			.then(function(data) {
				// Sem o texto original não abre o editor: salvar em cima sobrescreveria o post com vazio.
				// O erro já é sinalizado pelo tratamento padrão de ajax.
				if (!data || !data.string) {
					return;
				}

				var comentarioSemFormatacao = data.string;
				vm.comentarioEdicao = { id: comentario.id, texto: comentarioSemFormatacao };
				tec.scroll(".discussao-comentario-botoes");
			});
		}
	}
	
	function apagarComentario(comentario) {
		tec.confirm("Deseja apagar o seu comentário?", "Apagar comentário", function(apagar) {
			if (apagar) {
				var url = montarUrlDiscussao() + "/" + comentario.id;
				tec.apiDelete(url)
				.then(function() {
					for (var i = 0; i < vm.comentarios.length; i++) {
						if (vm.comentarios[i].id == comentario.id) {
							vm.comentarios.splice(i, 1);
						}
					}
					
					vm.comentarioEdicao = null;

					vm.paginaAtual = Math.ceil(vm.comentarios.length / vm.pageSize);
					vm.paginaAtual = Math.max(vm.paginaAtual, 1);
					if (vm.comentarios.length == 0) {
						vm.carregarPagina(1);
					}
				});
			}
		});
	}

	function notificarAlteracaoComentario() {
		var limite = 4000;
		var caracteres = vm.comentarioEdicao.texto ? vm.comentarioEdicao.texto.length : 0;
		if (caracteres > limite) {
			vm.comentarioEdicao.texto = vm.comentarioEdicao.texto.substring(0, limite);
			caracteres = limite;
		}
		vm.comentarioEdicao.caracteresDisponiveis = limite - caracteres;
	}
	
	function apelidoJaExiste(apelido) {
		checkApelidoJaExiste(apelido);
	}
	
	// private functions
	function inicializar() {
		vm.paginaAtual = 1;
		if (!vm.deslogado) {
			carregarPagina(vm.paginaAtual);
		}

		vm.comentarioEdicao = null;
		vm.questao.possuiPostsNaoVistos = false;
	}

	function carregarPagina(paginaIndice) {
		return tec.apiGet(montarUrlDiscussao(), { ordenarPor: vm.ordenarPor, pagina: paginaIndice })
		.then(function(data) {
			$scope.$evalAsync(function() {
				var comentarios = data.comentarios;
				var page = comentarios.pageComentarios;
				vm.pageSize = page.pageSize;
				vm.possuiVotoComentario = comentarios.possuiVotoComentario;
				vm.ordenarPor = comentarios.ordenarPor;
				var comentariosList = page.list;
				carregarFotoDeUsuarios(comentariosList);
				if ((!comentariosList || comentariosList.length == 0) || (comentariosList && comentariosList.length < page.pageSize)) {
					vm.ultimaPagina = true;
				} else {
					vm.ultimaPagina = false;
				}

				if (paginaIndice == 1) {
					vm.comentarios = [];
				}
				comentariosList = removerComentariosRepetidos(vm.comentarios, comentariosList);
				vm.comentarios.push.apply(vm.comentarios, comentariosList);

				verificarLinksYouTube(vm.comentarios);

				if (vm.pagina > 1 && (!comentarios || comentarios.length == 0)) {
					vm.paginaAtual--;
				}
				
				vm.terminouCarregar = true;
			});
		}).catch(function(erro) {
			console.log("Erro: " + erro);
		});
	}

	function removerComentariosRepetidos(comentariosAntigos, comentariosNovos) {
		// Devido a função publicarComentario incluir o comentário no array da
		// página atual (para ser visível na tela) e enviar o comentário pro backend.
		// Ao carregar uma nova página o mesmo comentário pode retornar
		// do backend e ficar duplicado na tela.
		for (var i = 0; i < comentariosAntigos.length; i++) {
			var comentarioAntigo = comentariosAntigos[i];
			for (var j = 0; j < comentariosNovos.length; j++) {
				var comentarioNovo = comentariosNovos[j];
				
				if (comentarioAntigo.id == comentarioNovo.id) {
					comentariosNovos.splice(j, 1);
					break;
				}
			}
		}

		return comentariosNovos;
	}

	function carregarFotoDeUsuarios(comentarios) {
		for (var i = 0; i < comentarios.length; i++) {
		    var comentario = comentarios[i];
			if (comentario) {
				if (comentario.fotoAlunoUuid && vm.mostrarFotoDeUsuarios) {
					comentario.fotoAlunoUrl = s3Url.fotos + "/" + comentario.fotoAlunoUuid;
				} else {
					comentario.fotoAlunoUrl = contextPathUrl + "img/perfil/avatar.png";
				}
			}
		}
	}

	function verificarLinksYouTube(comentarios) {
		var regxp = /(?:youtube\.com|youtu.be)\/(?:[\w\-]+\?v=|vi?\/|u\/\w\/|embed\/|\?vi?=|\&vi?=)?([^#\&\?\s<]*)/ig;
        var resultado;

		for (var i = 0; i < comentarios.length; i++) {
			var comentario = comentarios[i];

			var texto = comentario.comentario;

			var linksEncontrados = []

			while((resultado = regxp.exec(texto)) !== null) {
				linksEncontrados.push({posicao: resultado.index + resultado[0].length, id: resultado[1]});
			}

			// Reseta a posição do regex pro próximo texto;
			regxp.lastIndex = 0;

			for (var l = linksEncontrados.length - 1; l >= 0; l--) {
				/*
					- O primeiro div serve para colocar um tamanho máximo e o segundo para que fique responsivo.
					- O '-nocookie' no host é para não enviar cookies sem que o usuário veja o vídeo.
					- O parâmetro 'origin' serve para não dar erro de CORS.
				*/
				var embed = '<div class="embed-youtube-wrapper"><div class="embed-youtube"><iframe src="https://www.youtube-nocookie.com/embed/' + linksEncontrados[l].id + '?origin=' + window.location.origin +
					'" allowfullscreen=""frameborder="0"><br></iframe></div></div>';

				texto = texto.substring(0, linksEncontrados[l].posicao) + embed + texto.substring(linksEncontrados[l].posicao);
			}

			comentario.comentario = texto;
		}
	}

	function votarComentario(comentario, voto) {
		if(!$.isAssinanteLogado()) {
			mostrarAlertaExclusivoParaAssinantes();
			return;
		}

		if (vm.votoEmProgresso) {
			return;
		}

		vm.votoEmProgresso = true;

		tec.apiPut(montarUrlDiscussao() + "/" + comentario.id + "/voto", { voto: voto, requestId: "api-voto-forum" })
		.then(function(data) {
			comentario.quantidadeVoto = data.comentario.quantidadeVoto;
			comentario.voto = data.comentario.voto;			
			vm.votoEmProgresso = false;
			vm.possuiVotoComentario = true;
		});
	}
	
	function montarUrlDiscussao() {
		return "/discussoes/" + vm.questao.idQuestao + "/comentarios-alunos";
	}
	
	function silenciarDono(comentario) {
		tec.apiPost("/discussoes/silenciar-dono", {idComentario: comentario.id})
			.then(function() {
				comentario.silenciado = true;
			});
	}
	
	function bloquearDono(comentario) {
		var msg = "Deseja bloquear o usuário \"" + comentario.apelidoUsuario + "\"? " +
				  "<br /><br /> " +
				  "Os bloqueios podem ser revistos na área de perfil do aluno."
		tec.confirm(msg, "Bloquear Usuário", function(confirmou) {
			if (confirmou) {
				tec.apiPost("/discussoes/bloquear-dono", {idComentario: comentario.id})
					.then(function() {
						for (var i = 0; i < vm.comentarios.length; i++) {
							if (comentario.donoId == vm.comentarios[i].donoId) {
								vm.comentarios.splice(i, 1);
								i--;
							}
						}

						vm.paginaAtual = Math.ceil(vm.comentarios.length / vm.pageSize);
						vm.paginaAtual = Math.max(vm.paginaAtual, 1);
						if (vm.comentarios.length == 0) {
							vm.carregarPagina(1);
						}
					});
			}
		});
	}
	
	function desfazerSilenciar(comentario) {
		tec.apiPost("/discussoes/desfazer-silenciar", {idComentario: comentario.id})
		.then(function() {
			comentario.silenciado = false;
		});		
	}
	
	function checkApelidoJaExiste(apelido) {
		if (!apelido) {
			return false;
		} else {
			return tec.apiGet("/alunos/aluno-logado/apelido-ja-existe", { apelido: apelido })
				.then(function(data) {
					vm.apelidoNaoPermitido = Boolean(data.boolean);
					return vm.apelidoNaoPermitido;
				});
		}
	}

	function mostrarAlertaExclusivoParaAssinantes() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	}

	function mostrarAlertaExclusivoParaLogados() {
		tec.alert("Faça login no sistema para ter acesso a esta funcionalidade.");
	}
	
	// funções caderno interno / ao lado
	
	function setSessao(idCaderno, sessao) {
		localStorage.setItem(idCaderno + "["+userId+"]", JSON.stringify(sessao));
	}
	
	function getAlternativa(indice) {
		if (vm.questao.alternativas.length > 2) {
			return vm.alternativasME[indice];
		} else {
			if (indice == 0) {
				return "C";
			} else if (indice == 1) {
				return "E";
			}			
		}
		return;
	}

	function isAlternativaSelecionada(indice) {
		if (vm.questao.alternativaSelecionada) {
			return vm.questao.alternativaSelecionada - 1 == indice;
		}
		return false;
	}

	function isLogado() {
		return tec.isLogado();
	}
	
	function riscarAlternativa(indice) {
		return (vm.questao.alternativasClicadas[indice] > 0 && Math.abs(vm.questao.alternativasClicadas[indice] % 2) == 0 );
	}

	function limparAlternativasRiscadas() {
		for (i = 0; i < 5; i++) {
			vm.questao.alternativasClicadas[i] = 0;
		}
	}

	function buscarDescricaoDaAlternativa (posicao) {
		var i = posicao - 1;
		if (vm.questao.tipoQuestao == 'MULTIPLA_ESCOLHA') {
			return vm.alternativasME[i];
		} else {
			return vm.questao.alternativas[i];
		}
	}

	function sincronizarDadosDoCaderno(data) {
		if (!vm.caderno) {
			return;
		}
		// Finalizar caderno caso tenha terminado questoes em branco
		if (vm.questao.cadernoFinalizado == true && (vm.caderno.finalizado != vm.questao.cadernoFinalizado)) {
			vm.caderno.finalizado = true;
			vm.relogio.finalizado = true;
			tecDadosQuestao.finalizarCaderno(vm.caderno.idCaderno);
		}
		
		// Atualizar questoes marcadas
		var numero = parseInt(vm.questao.numeroQuestoesMarcadas);
		if (numero == 0) {
			vm.textoQuestoesMarcadas = null;
		} else if (numero == 1) {
			vm.textoQuestoesMarcadas = numero + " questão assinalada mas não resolvida"
		} else {
			vm.textoQuestoesMarcadas = numero + " questões assinaladas mas não resolvidas"
		}

		// botão proxima favorita
		vm.caderno.botaoFavoritaHabilitado = false;
		if (vm.caderno.listaFavoritas && vm.caderno.listaFavoritas.length > 1) {
			vm.caderno.botaoFavoritaHabilitado = true;
		} else if (vm.caderno.listaFavoritas && vm.caderno.listaFavoritas.length === 1 && vm.caderno.listaFavoritas[0] != vm.questao.idQuestao) {
			vm.caderno.botaoFavoritaHabilitado = true;
		}
		//

		// botão proxima anotada
		vm.caderno.botaoAnotadaHabilitado = false;
		if (vm.caderno.listaAnotadas && vm.caderno.listaAnotadas.length > 1) {
			vm.caderno.botaoAnotadaHabilitado = true;
		} else if (vm.caderno.listaAnotadas && vm.caderno.listaAnotadas.length === 1 && vm.caderno.listaAnotadas[0] != vm.questao.idQuestao) {
			vm.caderno.botaoAnotadaHabilitado = true;
		}
	}

	function exibirAlertaInvestidaCompleta() {
		var mostrar = localStorage.getItem("tec.exibirAnimacaoInvestida" + "["+userId+"]") === "true";
		if(mostrar) {
			confetti({
			  particleCount: 100,
			  spread: 70,
			  origin: { y: 0.6 }
			});				
		}

		Toastify({
		  text: "🎉 Parabéns, você completou a investida de hoje!",
		  duration: 3500,
		  gravity: "top", // `top` or `bottom`
		  position: "right", // `left`, `center` or `right`
		  stopOnFocus: true, // Prevents dismissing of toast on hover
		  className: "info"
		}).showToast();
	}

	//https://tecconcursos.atlassian.net/browse/TEC-2485
	//Alteração no iframe do caderno - enviar mensagem da questão e resolução para a janela pai
	function postMessageComResolucaoQuestao(data){
		var acertou;
		var idQuestao;
		if (data.questao) {
			idQuestao = data.questao.idQuestao;
			acertou = data.questao.alternativaSelecionada == data.questao.numeroAlternativaCorreta;
		} else {
			idQuestao = data.resolucao.idQuestao;
			acertou = data.resolucao.acertou;
		}
		var message = 'resolucao;'+ idQuestao + ';' + acertou;
		window.parent.postMessage(message, "*");
		return data;
	}

	function resolverQuestao() {
		if (vm.caderno && vm.relogio) {
			resolverQuestaoCaderno();
		} else if (vm.caderno && !vm.relogio) {
			resolverQuestaoCadernoAberto();
		} else {
			resolverQuestaoSemCaderno();			
		}
	}


	function resolverQuestaoCadernoAberto() {
		vm.aguardandoResolucao = true;

		var idCaderno = vm.caderno.idCaderno;
		var sessao = getSessao(idCaderno);

		if(vm.config.filtrarQuestoes && vm.questao.hash) {
			vm.caderno.cadernoHash = vm.questao.hash;
		}

		var params = {
			requestId: "resolver-questao-caderno-aberto",
			id: vm.caderno.idCaderno,
			idQuestao: vm.questao.idQuestao,
			alternativaSelecionada: vm.questao.alternativaSelecionada,
			cadernoHash: vm.caderno.cadernoHash
		};

		tecDadosQuestao.resolucaoCadernoAberto(params)
		.then(vm.postMessageComResolucaoQuestao)
		.then(function (data) {
			if (data.error) {
				exibirMensagemLimiteAtingido();
			} else {
				vm.questao.numeroAlternativaCorreta = data.resolucao.alternativa;
				vm.questao.correcaoQuestao = data.resolucao.acertou;

				if (data.resolucao.conquistouInvestida) {
					vm.questao.conquistouInvestida = true;
					exibirAlertaInvestidaCompleta();
				}

				if (vm.questao.correcaoQuestao) {
					sessao.acertos = Number(sessao.acertos) + 1;
				} else {
					sessao.erros = Number(sessao.erros) + 1;
				}
				if (!sessao.questoes) {
					sessao.questoes = {};
				}
				sessao.questoes[vm.questao.idQuestao] = {
						selecionada: vm.questao.alternativaSelecionada,
						correta: data.resolucao.alternativa,
						acertou: data.resolucao.acertou
				};

				sessao.resolvidas = Number(sessao.resolvidas) + 1;
				setSessao(idCaderno, sessao);
			}
		})
		.then(vm.limparAlternativasRiscadas)
		.then(function() {
			vm.aguardandoResolucao = false;
		})
		.catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}

			vm.aguardandoResolucao = false;
		});
	}
	
	
	function resolverQuestaoSemCaderno() {
		var params = { alternativa: vm.questao.alternativaSelecionada, questaoAdaptadaOuInedita: vm.questao.questaoAdaptadaOuInedita };
		if(vm.questao.formatoQuestao == 'DISCURSIVA') {
			params.correcaoQuestao = true;
		}

		tecDadosQuestao.alterarQuestao(vm.questao.idQuestao, params)
		.then(vm.callbackCarregarQuestaoSemScroll)
		.then(function() {
			if (vm.questao.conquistouInvestida) {
				exibirAlertaInvestidaCompleta();
			}
		})
		.then(function() {
			if (vm.manterResolucao) {
				var sessao = getSessao(vm.pastaAtual);
				if (!sessao.questoes) {
					sessao.questoes = {};
				}
				sessao.questoes[vm.questao.idQuestao] = {
						selecionada: vm.questao.alternativaSelecionada,
						correta: vm.questao.numeroAlternativaCorreta,
						acertou: vm.questao.numeroAlternativaCorreta == vm.questao.alternativaSelecionada
				};

				setSessao(vm.pastaAtual, sessao);
			}

		})
		.then(limparAlternativasRiscadas)
		.catch(function(data) {
			if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}
		});
	}
	
	
	function resolverQuestaoCaderno() {
		vm.aguardandoResolucao = true;

		var params = {
			alternativa: vm.questao.alternativaSelecionada,
			resolver: true,
			atualizarCronometro: !vm.relogio.pausa,
			questaoAdaptadaOuInedita: vm.questao.questaoAdaptadaOuInedita,
			requestId: "alterar-questao-atual-caderno",
			resolvida: false
		};

		tecDadosQuestao.alterarQuestaoAtualCaderno(vm.caderno.idCaderno, params)
		.then(vm.postMessageComResolucaoQuestao)
		.then(vm.callbackCarregarQuestaoSemScroll)
		.then(function() {
        	if (vm.questao.conquistouInvestida) {
        		exibirAlertaInvestidaCompleta();
        	}
        })
		.then(vm.sincronizarDadosDoCaderno)
		.then(vm.limparAlternativasRiscadas)
		.then(function() {
			vm.aguardandoResolucao = false;
		})
		.catch(function(data) {
			if ((typeof data === 'string' || data instanceof String) && data.includes("duplicada")) {
			} else if (data && data.data && data.data.error && data.data.error.includes("Limite")) {
				tec.alert("Limite de resoluções por dia atingido. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
			}

			vm.aguardandoResolucao = false;
		});
	}
	
	// private
	function getSessao(idCaderno) {
		var sessaoObj = localStorage.getItem(idCaderno + "["+userId+"]");
		if (!sessaoObj) {
			var sessao = {acertos: 0, erros: 0, resolvidas: 0};
			return sessao;
		} else {
			var sessao = JSON.parse(sessaoObj);
			return sessao;
		}
	}

	function selecionarAlternativa(alternativa) {
		vm.atualizarAlternativa = true;
		var cliques = vm.questao.alternativasClicadas[alternativa];
		
		if (cliques > 0) {
			vm.questao.alternativasClicadas[alternativa] = ++cliques;
			// se for par
			if (Math.abs(cliques % 2) == 0) {
				vm.questao.alternativaSelecionada = null;
			}
			
		} else {
			// numero de clicks impar volta pra zero
			for (i = 0; i < 5; i++) {
				if (Math.abs(vm.questao.alternativasClicadas[i] % 2) != 0) {
					vm.questao.alternativasClicadas[i] = 0;
				}
			}
			vm.questao.alternativasClicadas[alternativa] = 1;
			vm.questao.alternativaSelecionada = alternativa + 1;
		}
	}
	
	function resolverQuestaoIneditaOuAdaptada() {
		if(vm.questao.assinanteAvancado) {
			resolverQuestao();
		}
	}
	
	function mostrarTextoAssociado() {
		var textoAssociadoLink = $(".link-textoassociado");

		textoAssociadoLink.on('click', function() {
			var mostrarTextoAssociado = textoAssociadoLink.hasClass("collapsed");
			$.atualizarConfiguracaoUsuarioLocalStorage("mostrarTextoAssociado" + "["+userId+"]", mostrarTextoAssociado);
		});

		$.obterValorConfiguracaoUsuario("mostrarTextoAssociado" + "["+userId+"]")
		.then(function(mostrar) {
			if(mostrar) {
				textoAssociadoLink.removeClass("collapsed");
				var textoAssociado = $(".textoassociado");
				textoAssociado.addClass("in");
			}
		});
	}
	
	function alertaResolverQuestaoIneditaOuAdaptada() {
		tec.alert('Para resolver esta questão é necessário possuir o Plano Avançado.', 'Questão adaptada / inédita');
	}

	function verificarResolucao(alternativa) {
		if (vm.questao.correcaoQuestao != null) {
			if (alternativa == vm.questao.numeroAlternativaCorreta && vm.questao.numeroAlternativaCorreta == vm.questao.alternativaSelecionada) {
				return "acerto";
			} else if (alternativa == vm.questao.numeroAlternativaCorreta) {
				return "correcao";
			} else if (alternativa == vm.questao.alternativaSelecionada) {
				return "erro";
			}
		}
		return "";
	}

	function verificarAlternativaGabarito(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao == "acerto" || resolucao == "correcao";
	}
	
	function verificarAlternativaErro(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao == "erro";
	}
	
	function verificarAlternativaSemMarcacao(alternativa) {
		var resolucao = verificarResolucao(alternativa);
		return resolucao != "acerto" && resolucao != "correcao" && resolucao != "erro";
	}

	function mostrarAlertaExclusivoParaAssinantes() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	}
	function mostrarAlertaExclusivoParaAssinanteAvancado() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do Plano Avançado.", "Recurso exclusivo do Plano Avançado");
	}
	
	function gerarCelebracaoAleatoria() {
		var celebracoes = ["Parabéns!", "Muito bem!", "Continue assim!", "Mandou bem!", "Boa!"];
		return celebracoes[Math.floor(Math.random() * celebracoes.length)];
	}


	function callbackCarregarQuestaoSemScroll(data) {
		callbackCarregarQuestao(data, true);
	}
	
	function zerarFormularioNotificacao() {
		vm.tipoErro = null;
		vm.subTipoErro = null;
		vm.abrirReportErro = false;
		vm.descricaoErro = "";
		vm.msgPreencherDetalheErro = false;
	}


	function callbackCarregarQuestao(data, impedirScroll) {
		$scope.$evalAsync(function() {
			tec.habilitarSelecao();
			// força propagação para controller TecQuestaoCadernoController...
			for (var property in data.questao) {
				vm.questao[property] = data.questao[property];
			}
			if (!vm.questao) {
				return null;
			}

			vm.carregrQuestaoAcabou = true;

			if(vm.token != null) {
				vm.questao.possuiComentario = true;
			}

			vm.celebracaoAleatoria = gerarCelebracaoAleatoria();
			vm.questao.temAnotacao = vm.questao.anotacao && vm.questao.anotacao.length;

			$timeout(function() {

				mostrarTextoAssociado();

				if (!impedirScroll) {
					vm.scrollSeNecessario();
				}
				$(window).scroll();
				vm.zerarFormularioNotificacao();
			});
		});
	}
});

// ////////////////////////////

module.factory("tecDadosQuestao", function($q, tec, $sce) {
	var service = {

		relogio: {
			inicio: null,
			tempoDecorrido: 0,
			interval: null,

			iniciar: function() {
				this.inicio = new Date();
				this.tempoDecorrido = 0;

				this.parar();

				this.interval = setInterval(function() {
					service.relogio.atualizarTempoDecorrido();
				}, 1000);
			},

			parar: function() {
				if (this.interval != null) {
					clearInterval(this.interval);
				}
			},

			obterTempoEParar: function() {
				this.parar();
				return this.tempoDecorrido;
			},

			atualizarTempoDecorrido: function() {
				this.tempoDecorrido = Math.floor((Date.now() - this.inicio) / 1000);

				if (this.tempoDecorrido >= 1800) { // 30min
					this.tempoDecorrido = 1800;
					this.parar();
				}
			}
		},

		pastas: [],

		carregarQuestao: carregarQuestao,
		carregarQuestaoDeslogado: carregarQuestaoDeslogado,
		alterarQuestao: alterarQuestao,
		carregarQuestaoCaderno: carregarQuestaoCaderno,
		alterarQuestaoAtualCaderno: alterarQuestaoAtualCaderno,
		buscarAleatoriaCaderno: buscarAleatoriaCaderno,
		buscarProximaNaoResolvidaCaderno: buscarProximaNaoResolvidaCaderno,
		buscarProximaFavorita: buscarProximaFavorita,
		buscarProximaAnotada: buscarProximaAnotada,
		buscarProximaFavoritaModulo: buscarProximaFavoritaModulo,
		carregarQuestaoModulo: carregarQuestaoModulo,
		buscarAleatoriaModulo: buscarAleatoriaModulo,
		buscarProximaNaoResolvidaModulo: buscarProximaNaoResolvidaModulo,
		buscarQuestaoDoTopicoSeguinteCaderno: buscarQuestaoDoTopicoSeguinteCaderno,
		buscarQuestaoDoTopicoAnteriorCaderno: buscarQuestaoDoTopicoAnteriorCaderno,
		buscarQuestaoDoTopicoSeguinteCadernoAberto: buscarQuestaoDoTopicoSeguinteCadernoAberto,
		buscarQuestaoDoTopicoAnteriorCadernoAberto: buscarQuestaoDoTopicoAnteriorCadernoAberto,
		alterarQuestaoModulo: alterarQuestaoModulo,
		carregarPastasFavoritas: carregarPastasFavoritas,
		salvarFavorita: salvarFavorita,
		salvarAnotacao: salvarAnotacao,
		removerFavorita: removerFavorita,
		criarPastaFavoritas: criarPastaFavoritas,
		notificarErro: notificarErro,
		buscarRevisaoGabarito,
		salvarErro: salvarErro,
		buscarProximaMarcadaNoCaderno: buscarProximaMarcadaNoCaderno,
		resolverTodasMarcadas: resolverTodasMarcadas,
		salvarExibirAssunto: salvarExibirAssunto,
		salvarExibirConcurso: salvarExibirConcurso,
		salvarExibirResolucao: salvarExibirResolucao,
		removerQuestaoAtualCaderno: removerQuestaoAtualCaderno,
		removerQuestaoIdCaderno: removerQuestaoIdCaderno,
		adicionarQuestaoEntreCadernos: adicionarQuestaoEntreCadernos,
		adicionarQuestaoACaderno: adicionarQuestaoACaderno,
		carregarConfiguracoesDoAluno: carregarConfiguracoesDoAluno,
		finalizarCaderno: finalizarCaderno,
		resolucaoCadernoAberto: resolucaoCadernoAberto,

		listarPastas: listarPastas,
		listarItensSubpasta: listarItensSubpasta,
	};
	return service;
	
	function carregarQuestaoDeslogado(id, params) {
		params = params || {};
		return tec.apiGet("/questoes/" + id + "/deslogado", params);
	}
	
	function carregarQuestao(id, params) {
		params = params || {};
		return tec.apiGet("/questoes/" + id, params);
	}
	
	function alterarQuestao(id, params) {
		return tec.apiPut("/questoes/" + id + "/resolucao", params);
	}

	function resolucaoCadernoAberto(params) { // /precisa ser post por causa
												// do hash
		return tec.apiPost("/caderno-aberto/" + params.id + "/questao/" + params.idQuestao +  "/solucao", params);
	}

	function carregarQuestaoCaderno(caderno, questao, params) {
		return tec.apiGet("/cadernos/" + caderno + "/questoes/" + questao, params);
	}

	function alterarQuestaoAtualCaderno(caderno, params) {
		return tec.apiPut("/cadernos/" + caderno + "/questoes/questao-atual", params);
	}
	
	function removerQuestaoAtualCaderno(caderno) {
		return tec.apiDelete("/cadernos/" + caderno + "/questoes/remover-questao-atual");
	}

	function removerQuestaoIdCaderno(caderno, numeroQuestao) {
		return tec.apiDelete("/cadernos/" + caderno + "/questoes/remover-questao-id/" + numeroQuestao);
	}
	
	function adicionarQuestaoEntreCadernos(caderno, params) {
		return tec.apiPost("/cadernos/" + caderno + "/questoes/adicionar-questao-entre-cadernos", params);
	}
	
	function adicionarQuestaoACaderno(caderno, params) {
		return tec.apiPost("/cadernos/" + caderno + "/questoes/adicionar-questao-a-caderno", params);		
	}

	function buscarAleatoriaCaderno(caderno, params) {
		return tec.apiPut("/cadernos/" + caderno + "/questoes/questao-aleatoria", params);
	}

	function buscarProximaNaoResolvidaCaderno(caderno, params) {
		return tec.apiPut("/cadernos/" + caderno + "/questoes/questao-proxima-nao-resolvida", params);
	}

	function buscarProximaFavorita(caderno, params) {
		return tec.apiPut("/cadernos/" + caderno + "/questoes/questao-proxima-favorita", params);
	}

	function buscarProximaAnotada(caderno, params) {
		return tec.apiPut("/cadernos/" + caderno + "/questoes/questao-proxima-anotada", params);
	}

	function buscarProximaFavoritaModulo(questaoModulo, params) {
		var url = criarUrlQuestaoModulo(questaoModulo, 'questao-proxima-favorita');
		return tec.apiGet(url, params);
	}

	function buscarQuestaoDoTopicoSeguinteCaderno(caderno, params) {
		return tec.apiPut("/cadernos/" + caderno + "/questoes/questao-topico-seguinte", params);
	}

	function buscarQuestaoDoTopicoAnteriorCaderno(caderno, params) {
		return tec.apiPut("/cadernos/" + caderno + "/questoes/questao-topico-anterior", params);
	}

	function buscarQuestaoDoTopicoSeguinteCadernoAberto(caderno, params) {
		return tec.apiGet("/caderno-aberto/" + caderno + "/questoes/questao-topico-seguinte", params);
	}

	function buscarQuestaoDoTopicoAnteriorCadernoAberto(caderno, params) {
		return tec.apiGet("/caderno-aberto/" + caderno + "/questoes/questao-topico-anterior", params);
	}
	
	function carregarQuestaoModulo(questaoModulo) {
		var url = criarUrlQuestaoModulo(questaoModulo);
		return tec.apiGet(url);
	}

	function alterarQuestaoModulo(questaoModulo, params) {
		var url = criarUrlQuestaoModulo(questaoModulo);
		return tec.apiPut(url, params);
	}

	function buscarAleatoriaModulo(questaoModulo, params) {
		var url = criarUrlQuestaoModulo(questaoModulo, 'aleatoria');
		return tec.apiGet(url, params);
	}

	function buscarProximaNaoResolvidaModulo(questaoModulo, params) {
		var url = criarUrlQuestaoModulo(questaoModulo, 'proxima-nao-resolvida');
		return tec.apiGet(url, params);
	}

	function buscarProximaMarcadaNoCaderno(caderno, params) {
		return tec.apiGet("/cadernos/" + caderno + "/questoes/questao-proxima-marcada", params);
	}

	function resolverTodasMarcadas(caderno) {
		return tec.apiPut("/cadernos/" + caderno + "/resolver-todas-marcadas");
	}

	function salvarExibirAssunto(caderno, mostrar) {
		var params = {exibirAssunto: mostrar}
		return tec.apiPut("/cadernos/" + caderno + "/exibir-assunto", params);
	}

	function salvarExibirConcurso(caderno, mostrar) {
		var params = {exibirConcurso: mostrar}
		return tec.apiPut("/cadernos/" + caderno + "/exibir-concurso", params);
	}

	function salvarExibirResolucao(mostrar) {
		var params = {"mostrar": mostrar};
		return tec.apiPut("/alunos/aluno-logado/mostrarAcertosEErros", params)
			.then(function() {
				$.atualizarConfiguracaoUsuarioLocalStorage("mostrarAcertosEErros" + "["+userId+"]", mostrar);
			});
	}

	function carregarPastasFavoritas() {
		return tec.apiGet("/pastas-favoritas")
		.then(function(data) {
			return data.pastas;
		});
	}
	
	function salvarFavorita(questao, params) {
		return tec.apiPost("/favoritas/" + questao, params);
	}

	function salvarAnotacao(questao, params) {
		return tec.apiPost("/favoritas/" + questao + "/anotacao", params);
	}
	
	function removerFavorita(questao) {
		return tec.apiDelete("/favoritas/" + questao);
	}
	
	function criarPastaFavoritas(nomePasta) {
		return tec.apiPost("/pastas-favoritas", { nome: nomePasta })
		.then(function(data) {
			return data.pasta;
		})
		.catch(function(error) {
			tec.alert("Já existe uma pasta com esse nome.")
			return $q.reject(error);
		});
	}
	
	function notificarErro(idQuestao, assunto, conteudo) {
		return tec.apiPost("/questoes/" + idQuestao + "/notificar-erro", { idQuestao: idQuestao, assunto: assunto, conteudo: conteudo })
		.then(function(data) {
			tec.alert("Sua notificação será analisada em breve. Agradecemos a sua colaboração!")
		});
	}
	
	function salvarErro(idQuestao, tipoErro, subTipoErro, descricaoErro ) {
		return tec.apiPost("/questoes/" + idQuestao + "/salvar-erro", { idQuestao: idQuestao, tipoErro: tipoErro, subTipoErro: subTipoErro, descricaoErro: descricaoErro })
		.then(function(data) {
			tec.alert("Sua notificação será analisada em breve. Agradecemos a sua colaboração!")
		});
	}

	function buscarRevisaoGabarito(idQuestao) {
		return tec.apiGet("/questoes/" + idQuestao + "/revisao-gabarito", {});
	}

	function finalizarCaderno(idCaderno) {
		return tec.apiPut("/cadernos/" + idCaderno + "/finalizar");
	}

	// private functions
	function criarUrlQuestaoModulo(questaoModulo, metodo) {
		var variavel = questaoModulo.numero;
		if (metodo) {
			variavel = metodo;
		}
		var url = "/teoria/modulos/" + questaoModulo.modulo + "/assuntos/" + questaoModulo.assunto + "/questoes/" + variavel + "?filtroAno=" + questaoModulo.filtroAno + "&filtroBanca=" + questaoModulo.filtroBanca;

		if (questaoModulo.modo == 'caderno') {
			if (questaoModulo.modulo !== 0) {
				url = "/aulas/cadernos/"  + questaoModulo.modulo + "/assuntos/" + questaoModulo.assunto + "/questoes/" + variavel + "?filtroAno=" + questaoModulo.filtroAno + "&filtroBanca=" + questaoModulo.filtroBanca
				+ "&materia=" + questaoModulo.materia;
			} else {
				url = "/aulas/materias/"  + questaoModulo.materia + "/assuntos/" + questaoModulo.assunto + "/questoes/" + variavel + "?filtroAno=" + questaoModulo.filtroAno + "&filtroBanca=" + questaoModulo.filtroBanca;
			}
		}

		return url;
	}

	function listarPastas() {
		return tec.apiGet("/pastas-cadernos/", { buscarSubpastas: true });
	}

	function listarItensSubpasta(idPasta, idSubpasta, ordenacao) {
		ordenacao = ordenacao || "nome";

		var respostaFunc = function(data) {
				data = data || {};

				if (service.mapCadernos) {
					$(data.itens).each(function(_, item) {
						item.objetivas = item.formatoQuestoes == "OBJETIVA";
						var progresso = service.mapCadernos.get(item.id);

						if (progresso) {
							item.numeroTotalQuestoes = progresso.numeroTotalQuestoes;
							item.numeroQuestoesResolvidas = progresso.numeroQuestoesResolvidas;
							item.porcentagemAcertos = progresso.porcentagemAcertos;
							item.porcentagemErros = progresso.porcentagemErros;

							item.porcentagemAcertosResolvidas = progresso.numeroQuestoesResolvidas == 0 ? 0 : (100 * (progresso.numeroAcertos / progresso.numeroQuestoesResolvidas)).toFixed(2);
							item.porcentagemErrosResolvidas = progresso.numeroQuestoesResolvidas == 0 ? 0 : (100 * (progresso.numeroErros / progresso.numeroQuestoesResolvidas)).toFixed(2);
						}
					});
				}

				return data.itens;
			}

		if (idSubpasta) {
			return tec.apiGet("/pastas-cadernos/" + idPasta + "/subpastas/" + idSubpasta + "/itens", { ordenacao: ordenacao })
				.then(respostaFunc);
		} else {
			return tec.apiGet("/pastas-cadernos/" + idPasta + "/subpastas/itens", { ordenacao: ordenacao, naoIncluirCadernosSubpasta: true })
				.then(respostaFunc);
		}

	}

	function carregarConfiguracoesDoAluno() {
		return $.obterConfiguracaoUsuario()
			.then(function(config) {
				service.configuracaoUsuario = config;

				service.configuracaoUsuario.mensagemResolucaoAcerto = $sce.trustAsHtml(config.mensagemResolucaoAcerto);
                service.configuracaoUsuario.mensagemResolucaoErro = $sce.trustAsHtml(config.mensagemResolucaoErro);

				return service.configuracaoUsuario;
			})
			.catch(function(){});
	}
});

module.filter("tecRemoverSegundosTimestamp", function() {
	return function(texto) {
		return texto.substring(0, texto.length - 3);
	};
});

module.directive('onOutsideElementClick', ['$document',  function($document) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			element.on('click', function(e) {
				e.stopPropagation();
			});

			var onClick = function() {
				scope.$apply(function() {
					scope.$eval(attrs.onOutsideElementClick);
				});
			};

			$document.on('click', onClick);

			scope.$on('$destroy', function() {
				$document.off('click', onClick);
			});
		}
	};
}]);

module.directive('tecVisualizacaoImagem', function($timeout) {
	return function(scope, element, attrs) {
		
		var aplicarViewerJS = function() {
			var imagens = element[0].querySelectorAll('img');

			if (imagens.length > 0) {
				for (var i = 0; i < imagens.length; i++) {
					var imagem = imagens[i];
					$(imagem).on('click', function(e) {
						e.preventDefault();
					});
					imagem.style.cursor = 'zoom-in';
					new Viewer(imagem, {
						navbar: false,
						title: false,
						toolbar: false
					});
				}
			}
		}
		
		$timeout(function() {
			var observer = new MutationObserver(function(mutations) {
				aplicarViewerJS();
			});
			observer.observe(element[0], {
				childList: true,
				subtree: true
			});
			aplicarViewerJS();
		});

	}
});

})();
