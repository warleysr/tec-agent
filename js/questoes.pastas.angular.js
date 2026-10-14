(function() {

var module = angular.module("tec.questoes");

module.directive('hover', ['$timeout', function () {
	var def = {
		restrict: 'A',
		priority: 101,
		link: function (scope, element, attrs) {
			element.context.addEventListener('mouseover', function(){
				var conditional = scope.$eval(attrs.hoverIf);
				if (conditional == true) {
					anime({
						targets: element.context,
						scale: 1.02,
						easing: 'spring(1, 80, 10, 0)'
					});
				} else {
					anime.remove(element.context);
					element.context.removeEventListener('mouseover',null);
					element.context.removeEventListener('mouseout',null);
				}
			}, false),
			element.context.addEventListener('mouseout', function(){
				var conditional = scope.$eval(attrs.hoverIf);
				if (conditional == true) {
					anime({
						targets: element.context,
						scale: 1.0,
						easing: 'spring(1, 80, 10, 0)'
					});
				} else {
					anime.remove(element.context);
					element.context.removeEventListener('mouseover',null);
					element.context.removeEventListener('mouseout',null);
				}
			}, false)
		}
	};
	return def;
}]);

module.controller("PastasQuestoesCtrl", function(tec, tecDadosPastas, tecDadosCadernos, $location) {
	var vm = this;
	vm.itens = [];
	vm.pastas = [];
	vm.criarNovaPasta = criarNovaPasta;
	vm.renomearPasta = renomearPasta;
	vm.excluirPasta = excluirPasta;
	vm.carregarProgresso = carregarProgresso;
	vm.buscar = buscar;
	vm.limparBusca = limparBusca;
	vm.valorBusca = null;
	vm.valorBuscado = null;
	vm.buscaCadernos = null;
	vm.tudoSelecionado = false;

	vm.listarPastas = listarPastas;
	vm.ativarExcluirCadernos = ativarExcluirCadernos;
	vm.ativarMoverCadernos = ativarMoverCadernos;
	vm.ativarUnirCadernos = ativarUnirCadernos;
	vm.excluirItens = excluirItens;
	vm.renomearCaderno = renomearCaderno;
	vm.selecionarLinha = selecionarLinha;
	vm.selecionarTudo = selecionarTudo;
	vm.unirCadernos = unirCadernos;
	vm.possuiItensSelecionados = possuiItensSelecionados;
	vm.contarItensSelecionados = contarItensSelecionados;
	vm.cancelarOperacaoPasta = cancelarOperacaoPasta;
	vm.compartilharCaderno = compartilharCaderno;
	vm.imprimirCaderno = imprimirCaderno;
	vm.moverItens = moverItens;
	vm.usuarioNaoAssinante = usuarioNaoAssinante;
	vm.modoExibicao = null;
	vm.mudarModoExibicaoParaListagem = mudarModoExibicaoParaListagem;
	vm.mudarModoExibicaoParaPastas = mudarModoExibicaoParaPastas
	vm.isModoExibicaoListagem = isModoExibicaoListagem;
	vm.isModoExibicaoPastas = isModoExibicaoPastas;
	vm.desabilitarBotaoApagarPasta = desabilitarBotaoApagarPasta;
	vm.fecharModalConfirmarExclusaoPasta = fecharModalConfirmarExclusaoPasta;
	vm.excluirPastaConfirmado = excluirPastaConfirmado;
	vm.isAssinante = $.isAssinanteLogado();

	ativar();

	function ativar() {
		atualizarModoExibicao();
		listarPastas();
	}

	function listarPastas(atualizar){
		if (tecDadosPastas.pastas.length == 0 || atualizar) {
			tecDadosPastas.listarPastas()
			.then(function(data) {
				tratarModoCurso(data.pastas);

				tecDadosPastas.pastas = data.pastas;
				vm.itens = data.pastas;
				vm.pastas = data.pastas;
			});
		}
	}

	function tratarModoCurso(pastas) {
		var pastasModoCursoString = localStorage.getItem("tec.pastasModoCurso" + "["+userId+"]");

		if (!pastasModoCursoString) {
			return;
		}

		var pastasModoCurso = new Set(JSON.parse(pastasModoCursoString));

		angular.forEach(pastas, function(p) {
			p.modoCurso = pastasModoCurso.has(p.id);
		});
	}
	
	function atualizarModoExibicao() {
		$.obterValorConfiguracaoUsuario("modoExibicaoPastas").then(function(modoExibicao) {
			vm.modoExibicao = modoExibicao.toLowerCase();
		}).catch(function() {
			vm.modoExibicao = "lista";
		});
	}

	function usuarioNaoAssinante() {
		tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
	}

	function criarNovaPasta() {
		if (!$.isAssinanteLogado()) {
			vm.usuarioNaoAssinante();
			return;
		}

		tec.prompt("Digite o nome da pasta", "", "Criar nova pasta", function(nomePasta) {
			if (nomePasta) {
				tecDadosPastas.criarPasta(nomePasta)
				.then(function(data) {
					if (data.pasta) {
						vm.itens.push(data.pasta);
						ordenarPastas();
					}
				});
			}
		});
	}

	function renomearPasta(pasta) {
		tec.prompt("Digite o nome da pasta", pasta.nome, "Renomear pasta", function(nomePasta) {
			if (nomePasta && nomePasta.length) {
				tecDadosPastas.renomearPasta(pasta.id, nomePasta)
				.then(function(data) {
					if (data.pasta) {
						angular.forEach(vm.itens, function(p) {
							if (p.id == data.pasta.id) {
								p.nome = data.pasta.nome;
								pasta = p;
							}
						});
						ordenarPastas();
					}
				});
			}
		});
	}

	function excluirPasta(pasta) {
		vm.pastaExcluirSelecionada = pasta;
		var element = document.getElementById('pasta-' + (pasta.id || 0));
		if (pasta.qtdCadernos && pasta.qtdCadernos > 0) {
			tec.confirm("Deseja excluir a pasta \"" + pasta.nome + "\" juntamente com TODOS os seus cadernos?", "Exclusão de Pasta", function(confirmou) {
				if (confirmou) {
					setTimeout(function() {
						$("#campoConfirmar").val('');
						vm.confirmacaoExclusaoPasta = '';
						$("#modalExclusaoPasta").modal("show");
					}, 0);
				}
			});
		} else {
			tec.confirm("Deseja excluir a pasta \"" + pasta.nome + "?", null, function(confirmou) {
				if (confirmou) {
					excluirPastaSemConfirmacao(pasta);
				}
			});
		}
	}

	function carregarProgresso(idPasta){
		tecDadosPastas.carregarProgresso(idPasta);
	}

	//private functions
	function excluirPastaSemConfirmacao(pasta) {
		tecDadosPastas.excluirPasta(pasta.id)
			.then(function() {
				var index = vm.itens.indexOf(pasta);
				vm.itens.splice(index, 1);
			});
	}

	function ordenarPastas(){
		if (vm.itens[0].id == 0) {
			var semClassificacao = vm.itens.shift();
		}
		vm.itens.sort(compare);
		if (typeof semClassificacao !== 'undefined') {
			vm.itens.unshift(semClassificacao);
		}
	}

	function buscar(){
		cancelarOperacaoPasta();
		limparCadernos();
		tecDadosPastas.buscar(vm.valorBusca)
		.then(function(data) {
			vm.buscaCadernos = tecDadosPastas.prepararCadernos(data.cadernos);
			tecDadosCadernos.cadernos = vm.buscaCadernos;
			vm.valorBuscado = vm.valorBusca;
			var mapCadernosPorPasta = {};
			$(vm.buscaCadernos).each(function(_, caderno) {
				var codPasta = !caderno.idPasta ? 0 : caderno.idPasta;
				if (!mapCadernosPorPasta[codPasta]) {
					mapCadernosPorPasta[codPasta] = [];
				}
				mapCadernosPorPasta[codPasta].push(caderno);
			});
			$(vm.itens).each(function(_, pasta) {
				var cadernos = mapCadernosPorPasta[pasta.id];
				if (cadernos) {
					pasta.cadernos = cadernos;
				}
			});
		});
	}

	function limparBusca() {
		cancelarOperacaoPasta();
		vm.valorBusca = null;
		vm.valorBuscado = null;
		vm.buscaCadernos = null;
		limparCadernos();
	}

	//private functions
	function compare(a, b) {
		var pastaA = a.nome.toUpperCase();
		var pastaB = b.nome.toUpperCase();

		var comparison = 0;
		if (pastaA > pastaB) {
			comparison = 1;
		} else if (pastaA < pastaB) {
			comparison = -1;
		}
		return comparison;
	}

	function limparCadernos() {
		$(vm.itens).each(function(_, pasta) {
			pasta.cadernos = null;
		});
	}

	function ativarExcluirCadernos(item) {
		selecionarTudo(false);
		vm.modoSelecao = true;
		vm.excluindoItens = true;
		if (item) {
			selecionarLinha(item);
		}
	}

	function ativarMoverCadernos(caderno) {
		selecionarTudo(false);
		listarPastas();
		delete vm.pastaDestino;
		vm.modoSelecao = true;
		vm.movendoItens = true;
		if (caderno) {
			selecionarLinha(caderno);
		}
	}

	function excluirItens() {
		$.alerts.confirm("Você realmente deseja excluir os cadernos selecionados?", null, function(confirmou) {
			if (confirmou) {
				var ids = buscarIdsCadernosSelecionados();

				tecDadosCadernos.excluirSelecionados({ cadernos: ids })
				.then(function() {
					vm.buscar();
				});
			}
		});
	}
	
	function ativarUnirCadernos(item) {
		selecionarTudo(false);
		if (item) {
			selecionarLinha(item);
		}
		vm.modoSelecao = true;
		vm.unindoItens = true;
	}
	
	function unirCadernos() {
		// dialog exige um argumento
		alertify.unirCadernoAlert("");
	}

	function selecionarLinha(caderno) {
		if (vm.modoSelecao) {
			caderno.selecionado = caderno.selecionado ? !caderno.selecionado : true;
			contarItensSelecionados();
		}
	}
	
	function selecionarTudo(checked) {
		$(tecDadosCadernos.cadernos).each(function(_, caderno) {
			caderno.selecionado = checked;
		});
		contarItensSelecionados();
	}
	
	function possuiItensSelecionados() {
		return vm.cadernosSelecionados > 0;
	}

	function contarItensSelecionados() {
		var selecionados = 0;
		$(tecDadosCadernos.cadernos).each(function(_, caderno) {
			if (caderno.selecionado) {
				selecionados++;
			}
		});
		vm.cadernosSelecionados = selecionados;
	}

	function cancelarOperacaoPasta() {
		vm.modoSelecao = false;
		vm.excluindoItens = false;
		vm.movendoItens = false;
		vm.unindoItens = false;
		vm.tudoSelecionado = false;
	}

	function renomearCaderno(caderno) {
		$.alerts.prompt("Digite o nome do caderno", caderno.nomeCaderno, "Renomear caderno", function(nomeCaderno) {
			if (nomeCaderno && nomeCaderno.length) {
				tecDadosCadernos.renomearCaderno(caderno.idCaderno, nomeCaderno)
				.then(function(data) {
					caderno.nomeCaderno = data.nome;
				});
			}
		});
	}

	function compartilharCaderno(caderno) {
		tecDadosCadernos.compartilharCaderno(caderno.idCaderno)
		.then(function(data) {
			var urlShortCaderno = data.links[0];
			var urlCaderno = data.links[1];
			var mensagem = tec.mensagemCompartilhamento(urlShortCaderno, urlCaderno); 
			$.alerts.alert(mensagem, "Compartilhar caderno");
		});
	}

	function imprimirCaderno(caderno) {
		window.location = $.getUrl("/questoes/cadernos/" + caderno.idCaderno + "/configurar-impressao");
	}

	function moverItens() {
		var ids = buscarIdsCadernosSelecionados();

		tecDadosCadernos.moverSelecionados(vm.pastaDestino, null, { cadernos: ids })
		.then(function() {
			vm.buscar();
		});
	}

	function buscarIdsCadernosSelecionados() {
		var ids = [];

		$(tecDadosCadernos.cadernos).each(function(_, caderno) {
			if (caderno.selecionado) {
				ids.push(caderno.idCaderno);
			}
		});

		return ids;
	}

	function mudarModoExibicaoParaListagem() {
		vm.modoExibicao = 'lista';
		atualizarModoExibicaoRemoto();
	}
	
	function mudarModoExibicaoParaPastas() {		
		vm.modoExibicao = 'pastas';
		atualizarModoExibicaoRemoto();
	}
	
	function atualizarModoExibicaoRemoto() {
		var param = { modoExibicaoPastas: vm.modoExibicao };
		tec.apiPut("/alunos/aluno-logado/alterar-modo-exibicao-pastas", param)
			.then(function() {
					$.atualizarConfiguracaoUsuarioLocalStorage("modoExibicaoPastas", vm.modoExibicao);
				});
	}

	function isModoExibicaoListagem() {
		return vm.modoExibicao == 'lista' || ($.isMobileOrTabletBrowser() || $.isApp());
	}
	
	function isModoExibicaoPastas() {
		return vm.modoExibicao == 'pastas' && !($.isMobileOrTabletBrowser() || $.isApp());
	}
	
	function desabilitarBotaoApagarPasta() {
		var confirmacao;
		if (vm.confirmacaoExclusaoPasta) {
			confirmacao = vm.confirmacaoExclusaoPasta.toUpperCase();
		}
		var disabled = !(confirmacao == 'APAGAR PASTA');
		return disabled;
	}
	
	function fecharModalConfirmarExclusaoPasta() {
		$("#campoConfirmar").val('');
		vm.confirmacaoExclusaoPasta = '';
		$("#modalExclusaoPasta").modal("hide");
	}
	
	function excluirPastaConfirmado() {		
		fecharModalConfirmarExclusaoPasta();
		excluirPastaSemConfirmacao(vm.pastaExcluirSelecionada);
	}
	
});

//////////////////////////////
module.factory("tecDadosPastas", function($q, tec) {
	var service = {
		pastas: [],
		criarPasta: criarPasta,
		renomearPasta: renomearPasta,
		excluirPasta: excluirPasta,
		carregarProgresso: carregarProgresso,
		listarPastas: listarPastas,
		buscar: buscar,
		prepararCadernos: prepararCadernos,
	};

	return service;

	function criarPasta(nome) {
		return tec.apiPost("/pastas-cadernos", { nome: nome })
		.catch(function(error) {
			tec.alert("Já existe uma pasta com esse nome.")
			return $q.reject(error);
		});
	}

	function renomearPasta(idPasta, nomePasta) {
		return tec.apiPut("/pastas-cadernos/" + idPasta, { nome: nomePasta })
		.catch(function(error) {
			tec.alert("Já existe uma pasta com esse nome.")
			return $q.reject(error);
		});
	}

	function excluirPasta(idPasta) {
		return tec.apiDelete("/pastas-cadernos/" + idPasta);
	}

	function carregarProgresso(idPasta){
		for (var i = 0; i < service.pastas.length; i++) {
			if (service.pastas[i].id == idPasta) {
				var pasta = service.pastas[i];
				tec.apiGet("/pastas-cadernos/"+ pasta.id + "/progresso")
				.then(function(data) {
					data = data.progresso || {};
					pasta.numeroTotalQuestoes = data.numeroTotalQuestoes;
					pasta.numeroQuestoesResolvidas = data.numeroQuestoesResolvidas;
					pasta.porcentagemAcertos = data.porcentagemAcertos;
					pasta.porcentagemErros = data.porcentagemErros;
				});
			}
		}
	}

	function listarPastas() {
		return tec.apiGet("/pastas-cadernos/");
	}

	function buscar(nome){
		return tec.apiGet("/cadernos/pesquisarPorNome", { nomeCaderno: nome });
	}

	function prepararCadernos(cadernos) {
		$(cadernos).each(function(_, caderno) {
			caderno.objetivas = caderno.tipoCaderno == "OBJETIVA";
		});
		return cadernos;
	}
});

})();
