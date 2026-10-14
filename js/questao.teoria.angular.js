(function() {

var module = angular.module("tec.questao-teoria", [ "tec.common" ]);

/*
* Parte da teoria geral com as abas definindo cada seção de teoria.
*/
module.directive("tecQuestaoConteudoTeorico", function() {
	return {
		restrict: "A",
		scope: {
			params: "&tecQuestaoConteudoTeorico",
		},
		templateUrl: "questao-conteudo-teorico-directive",
		controller: "TecQuestaoConteudoTeoricoCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			ctrl.inicializar(scope);
		}
	};
});

module.controller("TecQuestaoConteudoTeoricoCtrl", ["$scope", "$sce", "tecDadosCadernoTeoriaAssuntoAnexoCapitulo", function($scope, $sce, dadosAssuntoAnexoCapitulo) {
	var vm = {}

	vm.tipoTeoria = {
		"texto": {
			"enum": "TEXTO",
			descricao: "Aula em texto",
			solicitou: false,
			possuiConteudo: false
		},
		"video": {
			"enum": "VIDEO",
			descricao: "Videoaula",
			solicitou: false,
			possuiConteudo: false
		},
		"mapa": {
			"enum": "MAPA_MENTAL",
			descricao: "Mapa mental",
			solicitou: false,
			possuiConteudo: false
		},
	};

	vm.abaSelecionada = null;

	vm.desabilitarAbas = false;
	vm.mostrarSolicitar = false;
	vm.teoriaSolicitada = false;

	vm.dadosCapituloAnexo = null;

	vm.inicializar = function (scopeDiretiva) {
		var params = scopeDiretiva.params();

		vm.questao = params.questao;
		vm.capituloAberto = params.capituloAberto;
        vm.usuarioGratis = params.usuarioGratis;

		if (vm.isLogado()) {
			vm.inicializarComAcesso();
		} else {
			vm.inicializarSemAcesso();
		}
	};

	vm.inicializarSemAcesso = function() {
		vm.tipoTeoria["texto"].possuiConteudo = true;
		vm.tipoTeoria["video"].possuiConteudo = true;
		vm.tipoTeoria["mapa"].possuiConteudo = true;

		vm.desabilitarAbas = false;
		vm.abaSelecionada = "texto";
	};

	vm.inicializarComAcesso = function () {
		dadosAssuntoAnexoCapitulo.buscarOverview(vm.questao.idQuestao).then(function(dados) {
			vm.permissaoAcesso = dados.permissao;

			vm.tipoTeoria["texto"].possuiConteudo = dados.temTexto;
			vm.tipoTeoria["video"].possuiConteudo = dados.temVideo;
			vm.tipoTeoria["mapa"].possuiConteudo  = dados.temMapaMental;

			vm.tipoTeoria["texto"].solicitou = dados.solicitouTexto;
			vm.tipoTeoria["video"].solicitou = dados.solicitouVideo;
			vm.tipoTeoria["mapa"].solicitou  = dados.solicitouMapaMental;

			if (vm.permissaoAcesso.permitirAcesso) {
				vm.inicializarLogado();
			} else {
				vm.desabilitarAbas = true;
				vm.abaSelecionada = "aviso-limite";
			}
		});
	}

	vm.acessarTeoria = function() {
		vm.inicializarLogado();
	};

	vm.inicializarLogado = function() {
		vm.desabilitarAbas = false;

		if (vm.questao.idAssuntoAnexoCapitulo) {
			dadosAssuntoAnexoCapitulo.buscarDadosBasicos(vm.questao.idAssuntoAnexoCapitulo)
				.then(function(data) {
					vm.dadosCapituloAnexo = data;

					vm.definirAbaInicial();
				});
		} else {
			vm.definirAbaInicial();
		}
	};

	vm.definirAbaInicial = function() {
		if (vm.tipoTeoria["texto"].possuiConteudo) {
			vm.abaSelecionada = "texto";
		} else if(vm.tipoTeoria["video"].possuiConteudo) {
			vm.alterarAbaParaVideo();
		} else if (vm.tipoTeoria["mapa"].possuiConteudo && vm.isUsuarioAvancado()) {
			vm.alterarAbaParaMapas();
		} else {
			vm.mostrarSolicitar = true;
			vm.teoriaSolicitada = vm.tipoTeoria["texto"].solicitou
			vm.abaSelecionada = "texto";
		}
	};

	vm.alterarAba = function (novaAba) {
		if (novaAba === vm.abaSelecionada) {
			return;
		}

		vm.verificarMostrarSolicitar(novaAba);

		if (vm.mostrarSolicitar) {
			vm.abaSelecionada = novaAba;
			return;
		}

		if (novaAba === "video" && vm.isLogado()) {
			vm.alterarAbaParaVideo();
		} else if (novaAba === "mapa" && vm.isLogado()) {
			if (!vm.isUsuarioAvancado()) {
				$.alerts.alert("Esta funcionalidade está disponível para assinantes do Plano Avançado. <a href='"+contextPathUrl+"assinar'>Clique aqui</a> e assine agora mesmo.", "Recurso exclusivo do Plano Avançado");
			} else {
				vm.alterarAbaParaMapas();
			}
		} else {
			vm.abaSelecionada = novaAba;
		}
	};

	vm.alterarAbaParaVideo = function () {
		vm.buscarDadosVideos().then(function () {
			vm.abaSelecionada = "video";
		});
	};

	vm.alterarAbaParaMapas = function () {
		vm.buscarDadosMapas().then(function () {
			vm.abaSelecionada = "mapa";
		});
	};

	vm.buscarDadosVideos = function() {
		return dadosAssuntoAnexoCapitulo.buscarVideos(vm.questao.idAssuntoAnexoCapitulo).then(function(data) {
			vm.dadosVideos = data;
		});
	};

	vm.buscarDadosMapas = function() {
		return dadosAssuntoAnexoCapitulo.buscarMapas(vm.questao.idAssuntoAnexoCapitulo).then(function(data) {
			vm.dadosMapas = data;

			vm.dadosMapas.forEach(function(dado) {
				dado.url = s3Url.arquivo + "/" + dado.uuid;
			});
		});
	};

	vm.gerarSrcIframePdf = function(mapa) {
		return pathViewerPdf + "?file=" + mapa.url;
	};

	vm.gerarSrcIframeVideo = function(video) {
		var url = video.urlEmbed;
		if ($.isYoutubeVideo(url)) {
			url += '?enablejsapi=1';
		}
		return $sce.trustAsResourceUrl(url);
	};

	/**
	 * O src do <video> do vídeo próprio. Igual ao do caderno: o $sce é
	 * obrigatório no ng-src de <video> neste AngularJS (1.4.4).
	 */
	vm.gerarSrcVideoProprio = function(video) {
		return $sce.trustAsResourceUrl(video.urlEmbed);
	};

	vm.isLogado = function() {
		return $("#logado-site").val() == "true";
	};

	vm.isUsuarioAvancado = function() {
		return $("#assinante-avancado-site").val() == "true";
	}

	vm.verificarMostrarSolicitar = function(novaAba) {
		if (novaAba === "mapa") {
			vm.mostrarSolicitar = vm.questao.assinanteAvancado && !vm.tipoTeoria["mapa"].possuiConteudo;
		} else {
			vm.mostrarSolicitar = !vm.tipoTeoria[novaAba].possuiConteudo;
		}

		vm.teoriaSolicitada = vm.tipoTeoria[novaAba].solicitou
	}

	vm.solicitarTeoria = function() {
		dadosAssuntoAnexoCapitulo.solicitarTeoria(vm.questao.idAssunto, vm.tipoTeoria[vm.abaSelecionada]["enum"].toUpperCase())
			.then(function() {
				vm.tipoTeoria[vm.abaSelecionada].solicitou = true;
				vm.teoriaSolicitada = true;
			});
	}

	return vm;
}]);

module.factory("tecDadosCadernoTeoriaAssuntoAnexoCapitulo", function(tec) {
	var service = { };

	service.urlBase = "/assunto-anexo-capitulos/"
	service.dadosBasicos = null;
	service.videos = null;
	service.mapas = null;

	service.buscarOverview = function (idQuestao) {
		return tec.apiGet("/teoria/questao/" + idQuestao + "/overview")
			.then(function(data) {
				return data.overview;
			});
	}

	service.solicitarTeoria = function(idAssunto, tipo) {
		return tec.apiPost("/aulas/assunto/" + idAssunto + "/solicitar/" + tipo, {});
	}

	service.buscarDadosBasicos = function(idAssuntoAnexoCapitulo) {
		if(service.dadosBasicos != null && service.dadosBasicos.id === idAssuntoAnexoCapitulo) {
			return Promise.resolve(service.dadosBasicos);
		}

		service.videos = null;
        service.mapas = null;

		return tec.apiGet(service.urlBase + idAssuntoAnexoCapitulo + "/dados-basicos")
		.then(function(data){
			service.dadosBasicos = data.capitulo;

			return service.dadosBasicos;
		});
	};

	service.buscarVideos = function(idAssuntoAnexoCapitulo) {
		if(service.videos != null) {
			return Promise.resolve(service.videos);
		}

		return tec.apiGet(service.urlBase + idAssuntoAnexoCapitulo + "/videos")
		.then(function(data){
			service.videos = data.videos;

			return service.videos;
		});
	}

	service.buscarMapas = function(idAssuntoAnexoCapitulo) {
		if(service.mapas != null) {
			return Promise.resolve(service.mapas);
		}

		return tec.apiGet(service.urlBase + idAssuntoAnexoCapitulo + "/mapas-mentais")
		.then(function(data){
			service.mapas = data.mapasMentais;

			return service.mapas;
		});
	}

	return service;
});

module.directive("tecQuestaoTeoria", function() {
	return {
		restrict: "A",
		scope: {
			params: "&tecQuestaoTeoria",
			fonte: "&fonte",
			espacamento: "&espacamento",
			capituloAberto: "="
		},
		templateUrl: "questao-teoria-directive",
		controller: "TecQuestaoTeoriaCtrl",
		controllerAs: "vm",
		link: function(scope, element, attrs, ctrl) {
			var params = scope.params();
			ctrl.abrir(params.questao, scope.fonte, scope.espacamento, scope.capituloAberto, params);
		}
	};
});

module.controller("TecQuestaoTeoriaCtrl", function($scope, $location, $timeout, $compile, tec, tecDadosCadernoTeoria ) {
	var vm = this;
	vm.abrir = abrir;
	vm.capituloUsuario = {};
	vm.getFonte = null;
	vm.dados = tecDadosCadernoTeoria;
	vm.avisoPlanoAvancado = null;
	vm.menuAtivo = 1;
	vm.modoLeituraToggle = modoLeituraToggle;
	vm.ativarModoMarcaTexto = ativarModoMarcaTexto;
	vm.ativarModoBorracha = ativarModoBorracha;
	vm.desativarModoBorracha = desativarModoBorracha;
	vm.corSelecionada = 1;
	vm.ativarModoPostit = ativarModoPostit;
	vm.desativarModoPostit = desativarModoPostit;
	vm.desativarModoMarcaTexto = desativarModoMarcaTexto;
	vm.postitsAbertos = {};
	vm.postits = [];
	vm.avaliarCapitulo = avaliarCapitulo;
	vm.alternarAssuntoLido = alternarAssuntoLido;
	vm.informeErroMensagemAtiva = false;
	vm.conteudoInformeDeErro = "";
	vm.notificarErroDeTeoria = notificarErroDeTeoria;
	vm.trocarCor = trocarCor;
	vm.adicionarPostit = adicionarPostit;
	vm.postitNovo = null;
	vm.postitsAbertos = {};
	vm.fecharPostitAberto = fecharPostitAberto;
	vm.abrirPostitsDoContainer = abrirPostitsDoContainer;
	vm.salvarTamanhoPostit = salvarTamanhoPostit;
	vm.excluirPostit = excluirPostit;
	vm.capturarMarcacaoNoTexto = capturarMarcacaoNoTexto;
	vm.progresso = 0;
	vm.scrollParaTitulo = scrollParaTitulo;
	vm.exibirHistoricoDeAlteracoes = exibirHistoricoDeAlteracoes;
	vm.historicoAlteracoes = tecDadosCadernoTeoria.historicoAlteracoes;
	vm.isLogado = isLogado;
	vm.focalizarTeoria = focalizarTeoria;
	vm.bookmarksCache = []; // para mostrar no menu lateral
	vm.bookmarksTotal = 0;
	vm.menuLateralMarcacoesModo = 'notas';
	vm.mudarMenuLateralMarcacoesModo = mudarMenuLateralMarcacoesModo;
	vm.buscarTextoMarcacao = buscarTextoMarcacao;
	vm.excluirPostitFechado = excluirPostitFechado;
	vm.editarPostitFechado = editarPostitFechado;
	vm.cancelarEdicaoPostitFechado = cancelarEdicaoPostitFechado;
	vm.salvarPostitFechado = salvarPostitFechado;
	vm.excluirMarcaTexto = excluirMarcaTexto;
	vm.isMobile = isMobile;
	vm.postitsCarregadas = false;
	
	function abrir(questao, fonte, espacamento, capituloAberto, params) {
		vm.usuarioGratis = params.usuarioGratis;
		vm.questao = questao;
		vm.getFonte = fonte();
		vm.getEspacamento = espacamento();
		vm.capituloAberto = capituloAberto;
		
		//if (!vm.usuarioGratis) {
			ativar();
		//}
	}
	
	function isLogado() {
		return $("#logado-site").val() == "true";
	}
	
	function ativar() {
		vm.postitDropOk = false;
		vm.dados.teoriaPronta = false;
		vm.corSelecionada = 1;

		vm.dados.carregarCapitulo(vm.questao.capitulo)
			.then(function(capituloUsuario) {
				vm.capituloUsuario = capituloUsuario;
				if (vm.capituloUsuario.permitirAcesso) {
					executarAposCarregarTeoria();
				} else {
					$('#conteudoAmostraTeoria').html(vm.capituloUsuario.amostraTeoria);
				}
			});
	}
	
	var executarAposCarregarTeoria = function() {
		//esperar ate que todos os capitulos e resumos estejam carregados:
		var capitulosCarregados = $(".capituloCarregado").length;
		//console.log(capitulosCarregados + " de " + vm.dados.numeroTotalDeArquivosS3);
		
		if (capitulosCarregados >= vm.dados.numeroTotalDeArquivosS3) {
			//colocar aqui o que precisa ser carregado somente depois da teoria
			if (vm.dados.habilitarMarcaTexto) {
				inicializarMarcaTexto();
				carregarMarcacoes();
				if (!vm.postitsCarregadas) {				
					carregarPostits();
					vm.postitsCarregadas = true;
				}
			}
			$(".botao-fechar-complemento")[0].focus();
			carregarProgresso();
		} else {
			$timeout(executarAposCarregarTeoria, 1000);
		}
	}

	function carregarProgresso() {
		$(window).on('scroll', function(){
			var sHeight = $('body').height() - $(window).height();
			var perc = Math.max(0, Math.min(1, $(window).scrollTop()/sHeight));
			updateProgress(perc);
		}).on('resize', function(){
			$(window).trigger('scroll');
		});
		
		if (vm.capituloUsuario.progresso) {
			var prog = vm.capituloUsuario.progresso;
			updateProgress(prog);
			var sHeight = $('body').height() - $(window).height();
			window.scrollTo(0, sHeight*prog);
		}
	}
	
	function updateProgress(perc){
		$('.progress-indicator').css({width : perc*100 + '%'});
	}
	
	function modoLeituraToggle() {
		vm.capituloAberto.modoLeitura = !vm.capituloAberto.modoLeitura;

		var full = tec.estaEmFullScreen();
		if (!full && vm.capituloAberto.modoLeitura) {
			tec.exibirFullScreen(document.documentElement);
		} 
		if (full && !vm.capituloAberto.modoLeitura) {
			tec.sairFullScreen();
		}
	}
	
	function ativarModoMarcaTexto() {
		vm.menuAtivo = 2;
		vm.modoBorracha = false;
		vm.modoMarcaTexto = true;
		$("#conteudoTeoria").css("cursor", "cell");
	}
	
	function ativarModoBorracha() {
		vm.modoBorracha = true;
		$("#conteudoTeoria").css("cursor", "pointer");
	}

	function desativarModoBorracha() {
		vm.modoBorracha = false;
		$("#conteudoTeoria").css("cursor", "default");
	}

	function ativarModoPostit() {
		vm.menuAtivo = 3;
	}

	function desativarModoPostit() {
		vm.menuAtivo = 1;
		$("#conteudoTeoria").css("cursor", "default");
	}

	function desativarModoMarcaTexto() {
		vm.menuAtivo = 1;
		vm.modoBorracha = false;
		vm.modoMarcaTexto = false;
		$("#conteudoTeoria").css("cursor", "default");
		tec.desabilitarSelecao();
	}

	function avaliarCapitulo(nota) { 
		tecDadosCadernoTeoria.avaliarCapitulo(nota)
		.then(function() {
			vm.capituloUsuario.avaliacao = nota;
		});
	}
	function alternarAssuntoLido(lido) {
		tecDadosCadernoTeoria.alternarAssuntoLido(lido)
		.then(function() {
			vm.capituloUsuario.lido = lido;
		});
	}
	
	function notificarErroDeTeoria() {
		var texto = vm.conteudoInformeDeErro.trim();
		if (texto.length > 2) {
			tecDadosCadernoTeoria.notificarErroDeTeoria(texto)
			.then(function(retorno) {
				vm.conteudoInformeDeErro = "";
				vm.informeErroMensagemAtiva = true;
			});
		}
	}
	
	function trocarCor(cor) {
		ativarModoMarcaTexto();
		vm.corSelecionada = cor;
	}

	// **** grifo ******
	function salvarBookmarks() {
		if (vm.bookmarks.length > 0 || vm.bookmarksRemove.length > 0) {
			//salvar marca-texto no banco:
			return vm.dados.salvarTextoMarcado(vm.bookmarks, vm.bookmarksRemove)
			.then(function(data) {
				data = data.marcaTextos;
				var confirmarSobreposicao = data.confirmarSobreposicao;
				
				if (confirmarSobreposicao) {
					var texto = "Você está tentando marcar um texto onde já existe uma marcação. Tem certeza que quer sobrescrevê-la?";
					$.alerts.confirm(texto, "Atenção!", function(result) {
						if (result) {
							return vm.dados.salvarTextoMarcado(vm.bookmarks, vm.bookmarksRemove, true)
							.then(function(data) {
								data = data.marcaTextos;
								vm.bookmarks = [];
								vm.bookmarksRemove = [];
							});
						} else {
							deletarUltimaMarcacao();
							vm.bookmarks = [];
							vm.bookmarksRemove = [];
							vm.bookmarksTotal = data.marcacoes;	
						}
					});
				} else {					
					vm.bookmarks = [];
					vm.bookmarksRemove = [];
					vm.bookmarksTotal = data.marcacoes;				
				}
			})
		}
	}
	
	function gerarGroupIdMarcaTexto() {
		var groupIdUnico = true;
		do {
			groupIdUnico = true;
			var novoGroupIdMarcaTexto = parseInt(Math.random() * 1000000000); // inteiro aleatório
			for (var i = 0; i < vm.bookmarksTmp.length; i++) {
				var bookmark = vm.bookmarksTmp[i];
				if (bookmark.groupId == novoGroupIdMarcaTexto) {
					groupIdUnico = false;
					break;
				}
			}
		} while (!groupIdUnico);
		return novoGroupIdMarcaTexto;
	}
	
	function capturarMarcacaoNoTexto($event) {
		if (vm.dados.habilitarMarcaTexto) {
			if (vm.modoMarcaTexto && !vm.modoBorracha) {
				var selection = rangy.getSelection();
				var allRanges = selection.getAllRanges();
				var range = allRanges[0];
				
				var bookmarks = [];
				if (!vm.bookmarksTmp) {
					vm.bookmarksTmp = []; // para deletar o último grifo caso conflito
				}
				var groupId = gerarGroupIdMarcaTexto();
				$(range.getNodes()).each(function(i, el) {
					if (el.nodeType === 3) {
						el = $(el).closest('[id]')[0];
					}
					if ($(el).is("[id]")) {
						var bookmark = range.getBookmark(el);
						if (bookmark.start != bookmark.end) {
							bookmarks.push({
								start: bookmark.start,
								end: bookmark.end,
								id: bookmark.containerNode.id,
								hash: $(el).attr("hash"),
								color: vm.corSelecionada
							})
						}
					}
				});
				
				highlightScopedSelectedText();
				$(bookmarks).each(function(i, bookmark) {
					vm.bookmarks.push(bookmark);
					var bookmarkTmp = JSON.parse(JSON.stringify(bookmark));
					bookmarkTmp.grupo = groupId;
					vm.bookmarksTmp.push(bookmarkTmp);
				});
				
				salvarBookmarks();
			} else if (vm.modoMarcaTexto && vm.modoBorracha) {
				var bookmarks = [];

				var highlight = vm.highlighter.getHighlightForElement($event.target);

				if(highlight == null) {
					return;
				}

				var range = highlight.getRange();

				$(range.getNodes()).each(function(i, node) {
					if (node.nodeType === 3) {
						node = $(node).closest('[id]')[0];
					}
					if ($(node).is("[id]")) {
						var bookmark = range.getBookmark(node);

						if (bookmark.start != bookmark.end) {
							bookmarks.push({
								start: bookmark.start,
								end: bookmark.end,
								id: bookmark.containerNode.id,
								hash: $(node).attr("hash"),
							});
						}
					}
				});

				var selection = rangy.getSelection();
				selection.setSingleRange(range);

				vm.highlighter.unhighlightSelection(selection);

				if ($(bookmarks).length > 0) {
					$(bookmarks).each(function(i, bookmark) {
						vm.bookmarksRemove.push(bookmark);
					})
				}
				salvarBookmarks(); 
			}
		}
	}
	
	function deletarUltimaMarcacao() {
		if (vm.bookmarksTmp && vm.bookmarksTmp.length > 0) {
			var ultimoBookmark = vm.bookmarksTmp[vm.bookmarksTmp.length - 1];
			var ultimoGroupIdGrifo = ultimoBookmark.grupo;
			var idsDeletar = [];		
			
			for (var i = 0; i < vm.bookmarksTmp.length; i++) {
				var bookmark = vm.bookmarksTmp[i];
				var elementId = bookmark.id;
				if (bookmark.grupo == ultimoGroupIdGrifo) {
					if (!idsDeletar.includes(elementId)) {
						idsDeletar.push(elementId);						
					}
					vm.bookmarksTmp.splice(i, 1);
					i--;
				}
			}

			for (var i = 0; i < idsDeletar.length; i++) {
				var id = idsDeletar[i];
				
				$("[class^=highlight]").each(function(i, element) {
					var elementosPai = $(element).parents("#" + id);
					if (elementosPai && elementosPai.length > 0) {
						var highlight = vm.highlighter.getHighlightForElement(element);
						if (highlight) {
							var range = highlight.getRange();

							$(range.getNodes()).each(function(i, node) {
								if (node.nodeType === 3) {
									node = $(node).closest('[id]')[0];
								}
							});

							var selection = rangy.getSelection();
							selection.setSingleRange(range);

							vm.highlighter.unhighlightSelection(selection);
						}
					}
				});				
			}
			
			if (idsDeletar && idsDeletar.length > 0) {
				carregarMarcacoes();
			}
		}
	}
	
	function contarCaracteres(param) {
		if (param.parar) {
			return param.len;
		} else {
			if (param.element.nodeType === 3) {//se for texto
				param.len += $(param.element).text().length;
				return param.len;
			} else {
				$(param.element.childNodes).each(function() {
					if (this == param.elementLimit) {
						param.parar = true;
					}
					if (!param.parar) {
						param.element = this;
						param.len = contarCaracteres(param);
					}
				});
			}
		}
		return param.len;
	}

	function inicializarMarcaTexto() {
		vm.modoMarcaTexto = false;
		vm.highlighter = rangy.createHighlighter(window.document, 'textContent');

		for (var i = 1; i <= 5; i++) {
			vm.highlighter.addClassApplier(rangy.createClassApplier("highlight-" + i, {
				ignoreWhiteSpace: true,
				tagNames: ["span", "a"]
			}));
			vm.highlighter.addClassApplier(rangy.createClassApplier("highlight-" + i + "-changed", {
				ignoreWhiteSpace: true,
				tagNames: ["span", "a"]
			}));
		}
		
        vm.bookmarks = [];
        vm.bookmarksRemove = [];
	}
	
	function carregarMarcacoes(abaLateral) {
		alertify.set('notifier','position', 'top-right');
		var bookmarks = [];
		var alterados = {};
		
		//buscar do banco
		vm.dados.carregarTextoMarcado()
			.then(function(dados) {
				bookmarks = dados.bookmarks;
				vm.bookmarksTotal = bookmarks.length;
				if (abaLateral) {
					inserirPostitsMenuLateral(bookmarks);
				}								
				pintarBookmarksNaTela(bookmarks);	
			})
			.then(function(){
				vm.marcaTextoCarregado = true;

				//apagar id caso tenha referencias perdidas:
				if (vm.bookmarksRemove.length > 0) {
					salvarBookmarks();
				}
			});
	}
	
	function highlightScopedSelectedText(color, changed) {
		var cor = color;
		if (!color) {
			cor = vm.corSelecionada;
		}
		var sufixo = "";
		if (changed === true) {
			sufixo = "-changed";
		}
		vm.highlighter.highlightSelection("highlight-" + cor + sufixo, { containerElementId: "conteudoTeoria" });
    }
	
	// **** postit ******
	function adicionarPostit(cor) {
		if (vm.postitDropOk) {
			vm.corSelecionada = cor;
			if (!vm.postitNovo) {
				vm.postitNovo = { 
					id: null,
					containerId: null,
					color: cor,
					text: '',
				    width: 130,
			    	height: 110
				};
			}
			vm.postitNovo.color = cor;
			vm.postitsAbertos[vm.postitNovo.id] = vm.postitNovo;
		} else {
			adicionarPostit(cor);
		}
	}
	function carregarPostits() {
		prepararPostitDrop();

		vm.postitsContainer = {};
		vm.postitsAbertos = {};
		
		var postitsOrfaos = 0;
		
		vm.dados.listarPostits()
		.then(function(dados) {
			var postits = dados.postits;			
			vm.postits = postits;
			
			angular.forEach(postits, function(postit) {
				//verificar se ainda existe o paragrafo para ser associado e marcar os que estão orfaos
				if ($('#' + postit.containerId).length == 0) {
					postit.orfao = true;
					postitsOrfaos ++;
				} else {
					postit.orfao = false;
				}
				addPostitAoContainer(postit, postit.containerId);
				postit.referencia = $('#' + postit.containerId).text();
				postit.listagemModo = 'visualizacao';
			});
			//adicionar indicador no paragrafo
			for (var property in vm.postitsContainer) {
				if (postits) {
					angular.forEach(postits, function(postit) {
						if (postit.containerId == property) {
							adicionarIndicadorPostit(property, postit.color);							
						}
					});
				}
			}
		}).then(function() {
			if (postitsOrfaos > 0) {
				var msg = "Devido a atualização deste livro, algumas notas adesivas foram desassociadas. Por favor, arraste as notas para o parágrafo desejado.";
				tec.alert(msg, "Aviso de atualização do livro");
			}
		});
	}

	function prepararPostitDrop() {
		//colocar drop-spot em todos os ids:
		$('#conteudoTeoria').find("p, li, blockquote").each(function() {
			$(this).droppable({
				classes: {
					"ui-droppable-hover": "droppable-hover"
				},
				drop: function( event, ui ) {
					var containerEl = $(this);
					var postit = vm.postitsContainer[$(containerEl).attr("id")];
					if (!postit) {
						$(ui.draggable[0]).effect( 'drop', {}, 500 );
						associarPostitAoParagrafo( ui.draggable, containerEl );
					} else {
						$(ui.draggable[0]).effect( 'bounce', {}, 500 );
					}
				},
				over: function( event, ui ) {
					var containerEl = $(this);
					var postit = vm.postitsContainer[$(containerEl).attr("id")];
					if (postit) {
						$(containerEl).addClass("proibido-colar");
						$(containerEl).on( "dropout", function( event, ui ) {
							$(containerEl).removeClass("proibido-colar");
						} );
					}
				}
		    });
		})
		vm.postitDropOk = true;
	}
	function associarPostitAoParagrafo($item, containerEl) {
		 $item.fadeOut(function() {

			 var postitId = $item.attr("postitId");
			 $(containerEl).addClass( "postit-colado" );
			 var containerId = $(containerEl).attr("id");

			 if (!postitId) {
				//Salvar o postit nesse paragrafo
				 vm.postitNovo.containerId = containerId;
				 vm.dados.salvarPostit(vm.postitNovo)
				 .then(function(data) {
					 addPostitAoContainer(data.postit, containerId);
					 vm.postitNovo = null;
					 fecharPostitAberto(null);
					 //adicionar indicador
					 adicionarIndicadorPostit(containerId, data.postit.color);
					 data.postit.referencia = $('#' + data.postit.containerId).text();
					 vm.postits.push(data.postit);
					 data.postit.listagemModo = 'visualizacao';
				 });
				 
			 } else {
				 trocarDeContainer(postitId, containerId)
			 }
			 
	      });
	}
	
	function consultarPostitAberto(postitId) {
		return vm.postitsAbertos[postitId];
	}
	
	function excluirPostit(postitId) {
		var postit = vm.postitsAbertos[postitId];
		
		var i = 0;
		while (i < vm.postits.length) {
			if (vm.postits[i].id == postitId) {
				postit = vm.postits[i];
				break;
			}
			i++;
		}

		if (!postit.id) {
			postit.text = '';
			delete vm.postitsAbertos[postitId];
		} else {
			tec.confirm("A sua anotação será perdida. Deseja continuar?", "Excluir nota", function(result) {
				if (result) {
					vm.dados.excluirPostit(postit.id)
					.then(function() {
						removerPostitDoContainerAtual(postit);
						delete vm.postitsAbertos[postitId];
						vm.postits.splice(i, 1);
					})
				}
			});
		}
	}
	
	function abrirPostitsDoContainer(containerId) {
		var postitsArray = [];
		angular.forEach(vm.postitsContainer[containerId], function(postits) {
			postitsArray = postits;
		});
		
		angular.forEach(postitsArray, function(postit) {
			if (!vm.postitsAbertos[postit.id]) {
				vm.postitsAbertos[postit.id] = postit;
			}
		});
	}

	function salvarTamanhoPostit(postit, $event) {
		var target = $event.target;
		var sticky = $(target).closest('.ui-sticky');
		if (sticky) {
			var largura = $(sticky).width();
			var altura = $(sticky).height();
			postit.width = $(sticky).css("width").replace(/[^-\d\.]/g, '');
			postit.height = $(sticky).css("height").replace(/[^-\d\.]/g, '');
			postit.changed = true;
		}
	}
	
	function fecharPostitAberto(postitId) {
		var postit = vm.postitsAbertos[postitId];

		if (!postit.id) {
			postit.text = '';
		} else if (postit.changed) {
			//verifica se houve mudança para salvar
			vm.dados.salvarPostit(postit)
			.then(function(data) {
				postit.changed = false;
			});
		} 
		delete vm.postitsAbertos[postitId];
	}
	function adicionarIndicadorPostit(containerId, cor) {
		var container = $("#" + containerId);
		
		//nao existe mais o paragrafo
		if ($(container).length == 0) {
			//abrir e deixar o aluno decidir o que fazer
			abrirPostitsDoContainer(containerId);
		} else {
			var icone = $(container).find(".postit-icone");
			
			//verifica se já existe indicador para esse paragrafo
			if ($(icone).text() == "") {
				var iconeColorido = '<a ng-show="vm.postitsContainer[\'' + containerId + '\']" class="postit-aviso" ng-click="vm.abrirPostitsDoContainer(\'' + containerId + '\')" ><span class="postit-icone :cor" ></span></a>';
				if (cor == 1) {
					iconeColorido = iconeColorido.replace(":cor", "amarelo");
				} else if (cor == 2) {
					iconeColorido = iconeColorido.replace(":cor", "laranja");
				} else if (cor == 3) {
					iconeColorido = iconeColorido.replace(":cor", "vermelho");
				} else if (cor == 4) {
					iconeColorido = iconeColorido.replace(":cor", "verde");
				}
				icone = $(iconeColorido);
				var diretiva = angular.element(icone);
				var el = $compile( diretiva )( $scope );
				angular.element($(container)).append(icone);
				$(container).addClass( "postit-colado" );
				//acertar posição:
				var pos = $(container).position();
				pos.left -=18;
				if (tec.isMobile()) {
					$(icone).css({left: pos.left} );
				} else {
					$(icone).css({top: pos.top, left: pos.left} );
				}
			} else {
				$(container).addClass( "postit-colado" );
			}
		}
	}
	
	/** movimentar postits **/
	function addPostitAoContainer(postit, containerId) {
		var container = vm.postitsContainer[containerId];
		var novaReferencia = $('#' + containerId).text();
		if (novaReferencia == '') {
			// angular não atualiza referencia vazia na tela...
			novaReferencia = '&nbsp;';
		}
		if (!container) {
			container = {
				'postits': []	
			};
			container.postits.push(postit);
			vm.postitsContainer[containerId] = container;
			postit.referencia = novaReferencia;
			return 1;
		} else {
			container.postits.push(postit);
			postit.referencia = novaReferencia;
			return container.postits.length;
		}
	}
	
	function trocarDeContainer(postitId, novoContainerId) {
		var postit = consultarPostitAberto(postitId);
		//se for do mesmo para o mesmo, não faz nada
		if (postit.containerId == novoContainerId) {
			fecharPostitAberto(postitId);
			return;
		} else {
			postit.orfao = false;
			if (removerPostitDoContainerAtual(postit)) {
				//adicionar no novo
				//salvar
				postit.containerId = novoContainerId;
				vm.dados.salvarPostit(postit)
				.then(function(data) {
					addPostitAoContainer(postit, novoContainerId);
					
					adicionarIndicadorPostit(novoContainerId, postit.color);
					fecharPostitAberto(postit.id);
				});
			}
		}
	}
	function removerPostitDoContainerAtual(postit) {
		var containerAtual = vm.postitsContainer[postit.containerId];
		if (!containerAtual) {
			return false;
		} else {
			//remover postit do container atual
			var removerIndice = -1;
			for (var i = 0; i < containerAtual.postits.length; i++) {
				if (containerAtual.postits[i].id == postit.id) {
					removerIndice = i;
					break;
				}
			}
			if (removerIndice > -1) {
				containerAtual.postits.splice(removerIndice, 1);
				if (containerAtual.postits.length == 0) {
					delete vm.postitsContainer[postit.containerId];
				} 
			}
			$("#" + postit.containerId).removeClass( "postit-colado" );
			
			return true;
		}
	}
	
	function scrollParaTitulo() {
		$(".capitulo-teoria").scrollToElement({ extraOffset: -16, skipAnimation: false });
	}
	
	function exibirHistoricoDeAlteracoes() {
		if (!vm.historicoAlteracoes.dados) {
			tecDadosCadernoTeoria.buscarHistoricoDeAlteracoes()
			.then(function() {
				vm.historicoAlteracoes.exibir = true;
			});
		} else {
			vm.historicoAlteracoes.exibir = true;
		}
	}
	
	function mudarMenuLateralMarcacoesModo(modo) {
		if (modo == 'marcacoes') {
			carregarMarcacoes(true);
		}
		vm.menuLateralMarcacoesModo = modo;
	}
	
	function buscarTextoMarcacao(marcacao) {
		var containerId = marcacao.id;
		var start = marcacao.start;
		var end = marcacao.end;
		
		return $("#" + containerId).text().substring(start, end);
	}
	
	function excluirPostitFechado(postitId) {
		var postit;
		var i = 0;
		while (i < vm.postits.length) {
			if (vm.postits[i].id == postitId) {
				postit = vm.postits[i];
				break;
			}
			i++;
		}

		tec.confirm("A sua anotação será perdida. Deseja continuar?", "Excluir nota", function(result) {
			if (result) {
				vm.dados.excluirPostit(postit.id)
				.then(function() {
					removerPostitDoContainerAtual(postit);
					vm.postits.splice(i, 1);
					if (vm.postitsAbertos[postitId]) {
						// exclui postit aberto
						delete vm.postitsAbertos[postitId];
					}
				})
			}
		});
	}
	
	function editarPostitFechado(postit) {
		postit.textEdicao = postit.text;
		postit.listagemModo = 'edicao';
	}
	
	function cancelarEdicaoPostitFechado(postit) {
		postit.textEdicao = postit.text;
		postit.listagemModo = 'visualizacao';
	}
	
	function salvarPostitFechado(postit) {
		postit.text = postit.textEdicao;
		 vm.dados.salvarPostit(postit)
		 .then(function(data) {
			 postit.listagemModo = "visualizacao";
		 });
	}
	
	function focalizarTeoria(containerId, cor, isPostit, postitListagemModo) {
		if (!isPostit || (isPostit && postitListagemModo == 'visualizacao')) {
			var idElementContainer = "#" + containerId;
			$(idElementContainer).scrollToElement({skipAnimation: true});
			$(idElementContainer).addClass("teoria-focalizar-" + cor);
			$timeout(function() {
				$(idElementContainer).removeClass("teoria-focalizar-" + cor);					
			}, 2000);
		}
	}
	
	function excluirMarcaTexto(bookmark) {
		tec.confirm("A sua marcação será perdida. Deseja continuar?", "Excluir marcação", function(result) {
			if (result) {
				var highlightClass = 'highlight-' + bookmark.color;
				
				var container = $("#" + bookmark.id);
				$("#" + bookmark.id).find("." + highlightClass).each(function(index, bookmarkHighlight) {
					bookmarkHighlight = $(bookmarkHighlight);
					var indexOf = -1;
					indexOf = container.text().indexOf(bookmarkHighlight.text(), indexOf + 1);
					if (indexOf >= bookmark.start && indexOf <= bookmark.end) {
						bookmarkHighlight.removeClass(highlightClass);

						var range = rangy.createRange();
						range.moveToBookmark({
							start: bookmark.start,
							end: bookmark.end,
							containerNode: container.get(0)
						});
						range.select();
						var selection = rangy.getSelection();
						selection.setSingleRange(range);
						
						vm.highlighter.unhighlightSelection(selection);					
					}
				});
				vm.bookmarksRemove.push(bookmark);
				salvarBookmarks();
				excluirMarcacaoMenuLateral(bookmark);
				
				pintarBookmarksNaTela(vm.bookmarksCache);
			}
		});
	}
	
	function isMobile() {
		return $.isMobileOrTabletBrowser() || $.isApp();
	}

	function pintarBookmarksNaTela(bookmarks) {
		//carregar na tela
		$(bookmarks).each(function(i, el) {

			var container = $("#" + el.id)[0];
			//caso nao exista mais a referencia na tela, apagar
			if (!container) {
				console.log('Nao existe mais referencia ao id: ' + el.id);
				vm.bookmarksRemove.push(el);
			} else {
				var range = rangy.createRange();
				range.moveToBookmark({
					start: el.start,
					end: el.end,
					containerNode: container
				});
				range.select();
				
				if ($(container).attr("hash") == $(el).attr("hash")) {
					highlightScopedSelectedText(el.color, false);
				} else {
					highlightScopedSelectedText(el.color, true);
					
					if (!alterados[$(container).attr("id")]) {
						var diretivaMT = angular.element(document.createElement('marca-texto-alterado'));
						var el = $compile( diretivaMT )( $scope );
						angular.element(container).prepend(diretivaMT);
						
						alterados[$(container).attr("id")] = $(container).attr("hash");
					} 
					
				}
				rangy.getSelection().removeAllRanges();
			}

		});	
	}

	function excluirMarcacaoMenuLateral(bookmark) {
		for (var i = 0; i < vm.bookmarksCache.length; i++) {
			if (bookmark.id == vm.bookmarksCache[i].id) {
				vm.bookmarksCache.splice(i, 1);
				break;
			}
		}
	}
	
	function pintarBookmarksNaTela(bookmarks) {
		var alterados = {};
		//carregar na tela
		$(bookmarks).each(function(i, el) {

			var container = $("#" + el.id)[0];
			//caso nao exista mais a referencia na tela, apagar
			if (!container) {
				console.log('Nao existe mais referencia ao id: ' + el.id);
				vm.bookmarksRemove.push(el);
			} else {
				var range = rangy.createRange();
				range.moveToBookmark({
					start: el.start,
					end: el.end,
					containerNode: container
				});
				range.select();
				
				if ($(container).attr("hash") == $(el).attr("hash")) {
					highlightScopedSelectedText(el.color, false);
				} else {
					highlightScopedSelectedText(el.color, true);
					
					if (!alterados[$(container).attr("id")]) {
						var diretivaMT = angular.element(document.createElement('marca-texto-alterado'));
						var el = $compile( diretivaMT )( $scope );
						angular.element(container).prepend(diretivaMT);
						
						alterados[$(container).attr("id")] = $(container).attr("hash");
					} 
					
				}
				rangy.getSelection().removeAllRanges();
			}

		});	
	}
	
	function inserirPostitsMenuLateral(bookmarks) {
		vm.bookmarksCache = [];
		var elementosIdOrdem = [];
		$("*[hash]").each(function(i, el) {
			elementosIdOrdem.push(el.id);
		});
		
		for (var i = 0; i < bookmarks.length; i++) {
			var bookmark = bookmarks[i];
			var insercao = 0;
			for ( ; insercao < vm.bookmarksCache.length; insercao++) {
				var bookmarkInsercaoIndice = elementosIdOrdem.indexOf(bookmark.id);
				var bookmarkMenuLateralIndice = elementosIdOrdem.indexOf(vm.bookmarksCache[insercao].id);
				if (bookmarkInsercaoIndice < bookmarkMenuLateralIndice
				 	|| (bookmarkInsercaoIndice == bookmarkMenuLateralIndice && bookmark.start < vm.bookmarksCache[insercao].end)) {
					break;
				}
			}
			vm.bookmarksCache.splice(insercao, 0, bookmark);
		}
	}
});


module.factory("tecDadosCadernoTeoria", function(tec, $location) {
	var service = {
		capitulo: {},
		carregarCapitulo: carregarCapitulo,
		avaliarCapitulo: avaliarCapitulo,
		alternarAssuntoLido: alternarAssuntoLido,
		notificarErroDeTeoria: notificarErroDeTeoria,
		listarPostits: listarPostits,
		numeroTotalDeArquivosS3: 0,
		habilitarMarcaTexto: false,
		salvarPostit: salvarPostit,
		excluirPostit: excluirPostit,
		carregarTextoMarcado: carregarTextoMarcado,
		salvarTextoMarcado: salvarTextoMarcado,
		removerMarcacoesDoId: removerMarcacoesDoId,
		atualizarHashMarcaTexto: atualizarHashMarcaTexto,
		historicoAlteracoes: { exibir: false, dados: null },
		buscarHistoricoDeAlteracoes: buscarHistoricoDeAlteracoes
		
	};
	
	ativar();
	
	return service;
	
	function ativar() {
		rangy.init();
		service.urlBase = "/teoria/capitulo/";
	}

	function carregarCapitulo(idCapitulo) {
		return tec.apiGet(service.urlBase + idCapitulo)
		.then(function(data) {
			if (data.capituloUsuario.permitirAcesso) {
				service.capitulo = data.capituloUsuario.capitulo;
				
				service.numeroTotalDeArquivosS3 = 1;
				if (!service.capitulo.permitirMarcaTexto) {
					service.habilitarMarcaTexto = false;
				} else {
					service.habilitarMarcaTexto = true;
				}
				if (service.capitulo.urlConteudoResumo) {
					service.numeroTotalDeArquivosS3 ++;
				}
			}
			return data.capituloUsuario;
		});
	}
	
	function avaliarCapitulo(nota) {
		var url = service.urlBase + service.capitulo.id + "/avaliar-capitulo";
		var params = { idCapitulo: service.capitulo.id, nota: nota };
		
		return tec.apiPut(url, params);
	}
	
	function alternarAssuntoLido(lido) {
		return tec.apiPut(service.urlBase + service.capitulo.id + "/lido", { lido: lido });
	}
	
	function notificarErroDeTeoria(texto) {
		var url = service.urlBase + service.capitulo.id + "/notificar-erro-capitulo";
		var params = { idCapitulo: service.capitulo.id, conteudo: texto };
		return tec.apiPost(url, params);
	}

	//postits:
	function listarPostits() {
		var url = "/postit/capitulo/" + service.capitulo.id;
		return tec.apiGet(url + "/listar");
	}
	function salvarPostit(postit) {
		var params = {};
		params["postit.id"] = postit.id;
		params["postit.containerId"] = postit.containerId;
		params["postit.color"] = postit.color;
		params["postit.text"] = postit.text;
		params["postit.width"] = postit.width;
		params["postit.height"] = postit.height;
		var url = "/postit/capitulo/" + service.capitulo.id;
		return tec.apiPost(url + "/salvar", params);
	}

	function excluirPostit(postitId) {
		return tec.apiDelete("/postit/" + postitId + "/excluir");
	}
	
	//grifo
	function carregarTextoMarcado() {
		var params = {};
		return tec.apiGet(service.urlBase + service.capitulo.id + "/carregar-marca-texto", params);
	}
	function salvarTextoMarcado(bookmarks, bookmarksRemover, sobreescrever) {
		var params = {};
		var i = 0;
		params.sobreescrever = sobreescrever;
		angular.forEach(bookmarks, function (bookmark) {
			params["bookmarks[" + i + "].id"] = bookmark.id;
			params["bookmarks[" + i + "].hash"] = bookmark.hash;
			params["bookmarks[" + i + "].start"] = bookmark.start;
			params["bookmarks[" + i + "].end"] = bookmark.end;
			params["bookmarks[" + i + "].color"] = bookmark.color;
			i++;
		});
		i = 0;
		angular.forEach(bookmarksRemover, function (bookmark) {
			params["bookmarksRemover[" + i + "].id"] = bookmark.id;
			params["bookmarksRemover[" + i + "].start"] = bookmark.start;
			params["bookmarksRemover[" + i + "].end"] = bookmark.end;
			params["bookmarksRemover[" + i + "].hash"] = bookmark.hash;
			i++;
		});
		return tec.apiPut(service.urlBase + service.capitulo.id + "/marca-texto", params);
	}

	function removerMarcacoesDoId(idMarcacao) {
		var param = { id: idMarcacao }
		return tec.apiDelete(service.urlBase + "remover-marcacoes-do-id", param);
	}
	function atualizarHashMarcaTexto(id, hash) {
		var params = {
			id: id,
			hash: hash
		};
		return tec.apiPut(service.urlBase + "atualizar-hash", params);
	}
	function buscarHistoricoDeAlteracoes() {
		return tec.apiGet(service.urlBase + service.capitulo.id + "/buscar-historico-alteracoes")
		.then(function(data) {
			service.historicoAlteracoes.dados = data.historicoList;
		});
	}
});

//Diretiva para indicar que o professor alterou o conteúdo grifado pelo aluno.
//Essa diretiva é chamada dinanicamente no momento de carregamento dos marcatextos, no metodo AssuntoTeoriaCtrl.carregarMarcacoes()
module.directive("marcaTextoAlterado", function(tec, tecDadosCadernoTeoria) {
	return tec.defaultDirective({
		template: tec.multiline(function() {/**
			<span class="paragrafo-alterado" ng-click="vm.abrirOpcoes()">
				<i class="fa fa-exclamation-triangle" tec-tooltip="Este conteúdo marcado por você pode ter sido atualizado pelo professor. Clique para resolver" ></i>
			</span>
		**/}),
		controller: function($scope, $element) {
			var vm = this;
			vm.abrirOpcoes = abrirOpcoes;
			iniciar();

			function iniciar() {
				vm.dialogName = "alert-" + $scope.$id;
				createDialogMessage(vm.dialogName);
			}
			
			function abrirOpcoes() {
				var message = "O texto marcado por você neste trecho pode ter sido atualizado pelo professor. Deseja manter ou remover as marcações?";
				alertify[vm.dialogName](message);
			}
			
			function createDialogMessage(name) {
				alertify.dialog(name, function factory() {
					return {
					  main:function(message){
					    this.message = message;
					  },
					  setup:function(){
					      return { 
					        buttons:[{text: "Manter"}, {text: "Remover"}],
					        focus: { element:0 },
					        options: {
					            title: "Possível mudança nas marcações" 
					        }
					      };
					  },
					  prepare:function(){
					    this.setContent(this.message);
					  },
					  callback:function(closeEvent) {
						  //manter marcação
						  if (closeEvent.index == 0) {
							  var element = angular.element($element).parent();
							  
							  tecDadosCadernoTeoria.atualizarHashMarcaTexto($(element).attr("id"), $(element).attr("hash"))
					    		  .then(function() {
					    			  //remover o alerta
					    			  angular.element($element).remove();
					    		  });
							  
							  
						  }
						  //remover
						  if (closeEvent.index == 1) {
							  var element = angular.element($element).parent();
							  var bookmarksRemover = [];
							  bookmarksRemover.push({
								  start: 0,
								  end: $(element).text().length,
								  id: $(element).attr("id"),
								  hash: $(element).attr("hash")
							  })
							  
							  $(element).find('[class^="highlight-"]').removeClass(function (index, className) {
								  return (className.match (/^highlight-\S+/g) || []).join(' ');
							  });
							  
							  //salvar alteração
							  tecDadosCadernoTeoria.removerMarcacoesDoId($(element).attr("id"))
				    		  .then(function() {
				    			  //remover o alerta
				    			  angular.element($element).remove();
				    		  });

						  }
					  }
					}
				});
			}
		}
	});
});

module.directive("draggable", function(){
	return {
		scope: {
			postit: "="
		},
		restrict: "A",
		link: function(scope, element, attributes) {
			var postit = scope.postit;
			var container = postit.containerId;

			var posTop = 0;
			if (container) {
				if (!postit.orfao) {
					posTop = $("#" + container).position().top;
				}
			}

			$(element)
				.resizable()
				.draggable({
					  scroll: true,
					  cursor: "move",
					  create: function( event, ui ) {
						  if (container) {
							  var offset =  Number(posTop);
							  $(this).css({top: offset});
						  }
					  }
				 });
			
			$(element).draggable( "option", "cancel", ".editor" );

		}
	};
});

module.directive('ckeditor', function(tec) {
	return {
		require : 'ngModel',
		link : function(scope, element, attrs, ctrl) {
			var editor = CKEDITOR.inline(element[0], {
				customConfig: 'config_postit.js'
			});
			
			// view -> model
			editor.on('pasteState', function() {
				scope.$apply(function() {
					ctrl.$setViewValue(editor.getData());
				});
			});

			// model -> view
			ctrl.$render = function() {
				editor.setData(ctrl.$viewValue);
			};
			// load init value from DOM
			ctrl.$render();
			
			//hack para mobile: (para poder clicar dentro do editor)
			$(element).bind('touchstart', function(event){
				if (event.target.nodeName != 'SPAN') {
					event.stopPropagation();
				}
			});
			
			scope.$on("$destroy",function() {
				CKEDITOR.instances[editor.name].destroy();
			});
		}
	};
});


})();
