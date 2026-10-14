(function() {

var module = angular.module("tec.questoes");

module.controller("FavoritasQuestoesCtrl", function($location, $window, $routeParams, tec, tecDadosFavoritas) {
	var vm = this;
	vm.pastas = null;
	vm.pastaAtual = null;
	vm.itens = null;
	vm.ordenacao = (jsonPreferencias.ordenacaoFavoritas || "codigo").toLowerCase();
	vm.pagina = 1;
	vm.indiceQuestaoAtual = 0;
	vm.exibicaoLista = true;

	vm.carregarMaisQuestoes = carregarMaisQuestoes;
	vm.alterarPastaAtual = alterarPastaAtual;
	vm.recarregarPastaAtual = recarregarPastaAtual;
	vm.criarNovaPasta = criarNovaPasta;
	vm.renomearPasta = renomearPasta;
	vm.ordenar = ordenar;
	vm.ativarExcluirItens = ativarExcluirItens;
	vm.ativarMoverItens = ativarMoverItens;
	vm.ativarGerarCadernoObjetivas = ativarGerarCadernoObjetivas;
	vm.ativarGerarCadernoDiscursivas = ativarGerarCadernoDiscursivas;
	vm.excluirItens = excluirItens;
	vm.moverItens = moverItens;
	vm.cancelarOperacaoPasta = cancelarOperacaoPasta;
	vm.excluirPasta = excluirPasta;
	vm.selecionarLinha = selecionarLinha;
	vm.selecionarTudo = selecionarTudo;
	vm.possuiItensSelecionados = possuiItensSelecionados;
	vm.atualizarItensSelecionados = atualizarItensSelecionados;
	vm.questoesIDs = questoesIDs;
	vm.dados = tecDadosFavoritas;
	vm.alterarExibicaoFavoritas = alterarExibicaoFavoritas;
	vm.validarGerarCaderno = validarGerarCaderno;

	ativar();

	/////////
	function ativar() {
		if (abrirQuestaoId != null) {
			vm.exibicaoLista = false;
		}

		tecDadosFavoritas.inicializar($routeParams.id)
		.then(function() {
			vm.pastas = tecDadosFavoritas.pastas;
			vm.pastaAtual = tecDadosFavoritas.pastaAtual;

			tecDadosFavoritas.abrirPasta(vm.pastaAtual, vm.ordenacao, vm.dados._tamanho_pagina)
			.then(function() {
				vm.itens = tecDadosFavoritas.questoes;
				vm.indiceQuestaoAtual = encontrarIndice(abrirQuestaoId);
			});
		});
	}
	
	function carregarMaisQuestoes() {
		vm.pagina += 1;
		tecDadosFavoritas.carregarMaisQuestoes(vm.pastaAtual, vm.ordenacao, vm.pagina);
	}

	function alterarPastaAtual(pasta, quantidade) {
		var ordenarPor = vm.reordenarPor || vm.ordenacao;
		vm.pagina = 1;
		tecDadosFavoritas.abrirPasta(pasta, ordenarPor, quantidade || vm.dados._tamanho_pagina)
		.then(function() {
			vm.pastaAtual = tecDadosFavoritas.pastaAtual;
			vm.itens = tecDadosFavoritas.questoes;
			vm.tudoSelecionado = false;
			vm.cancelarOperacaoPasta();
			vm.ordenacao = ordenarPor;
		});
	}
	
	function recarregarPastaAtual() {
		var quantidade = vm.pagina > 1 ? vm.pagina * vm.dados._tamanho_pagina : vm.itens.length;
		vm.alterarPastaAtual(vm.pastaAtual, quantidade);
	}
	
	function criarNovaPasta() {
		tec.prompt("Digite o nome da pasta", "", "Criar nova pasta", function(nomePasta) {
			if (nomePasta) {
				tecDadosFavoritas.criarPasta(nomePasta)
				.then(function() {
					window.location.reload();
				});
			}
		});
	}
	
	function renomearPasta() {
		tec.prompt("Digite o nome da pasta", vm.pastaAtual.nome, "Renomear pasta", function(nomePasta) {
			if (nomePasta && nomePasta.length) {
				tecDadosFavoritas.renomearPastaAtual(nomePasta)
				.then(function() {
					vm.pastaAtual.nomePasta = nomePasta;
					window.location.reload();
				});
			}
		});
	}
	
	function ordenar(ordenacao) {
		if (vm.ordenacao == ordenacao) {
			return;
		}
		vm.reordenarPor = ordenacao;
		recarregarPastaAtual();
	}
	
	function ativarExcluirItens(item) {
		selecionarTudo(false);
		if (item) {
			selecionarLinha(item);
		}
		vm.modoSelecao = true;
		vm.exibicaoLista = true;
		vm.excluindoItens = true;
	}
	
	function ativarMoverItens(item) {
		selecionarTudo(false);
		if (!vm.pastaDestino) {
			vm.pastaDestino = tecDadosFavoritas.pastaAtual.id;
		}
		if (item) {
			selecionarLinha(item);
		}
		vm.modoSelecao = true;
		vm.exibicaoLista = true;
		vm.movendoItens = true;
	}
	
	function ativarGerarCadernoObjetivas() {
		listarPastasCadernos();
		vm.pastaCadernosDestino = null;
		selecionarTudo(false);
		vm.modoSelecao = true;
		vm.exibicaoLista = true;
		vm.gerandoCaderno = true;
		vm.gerandoCadernoObjetivas = true;
	}
	
	function ativarGerarCadernoDiscursivas() {
		listarPastasCadernos();
		vm.pastaCadernosDestino = null;
		selecionarTudo(false);
		vm.modoSelecao = true;
		vm.exibicaoLista = true;
		vm.gerandoCaderno = true;
		vm.gerandoCadernoObjetivas = false;
	}

	function validarGerarCaderno() {
		if(!$.isAssinanteLogado()) {
			if (vm.itensSelecionados.length > 500) {
				tec.alert("Cada caderno pode conter até <b>500 questões</b>. Para continuar, ajuste os filtros aplicados até que a quantidade de questões fique dentro desse limite.<br/><br/>"
					+"Quer criar cadernos com até <b>10 mil questões</b>? Assine o plano <a href='" + contextPathUrl + "assinar'>Padrão</a> ou <a href='" + contextPathUrl + "assinar'>Avançado</a>.",
					"Limite de Questões Excedido");
				return;
			}
		} else if (vm.itensSelecionados.length > 10000) {
			tec.alert("Cada caderno pode conter, no máximo, <b>10 mil questões</b>. Para continuar criando seu caderno, ajuste os filtros aplicados até que a quantidade de questões fique dentro desse limite.",
				"Limite de Questões Excedido");
			return;
		}

		$(".listagem-gerar-caderno").submit();
	}
	
	function excluirItens() {
		tec.confirm("Você realmente deseja remover as questões favoritas selecionadas?", null, function(confirmou) {
			if (confirmou) {
				tecDadosFavoritas.excluirSelecionados()
				.then(function() {
					vm.recarregarPastaAtual();
				});
			}
		});
	}

	function moverItens() {
		tecDadosFavoritas.moverSelecionados(vm.pastaDestino)
		.then(function() {
			vm.recarregarPastaAtual();
		});
	}

	function cancelarOperacaoPasta() {
		vm.modoSelecao = false;
		vm.excluindoItens = false;
		vm.movendoItens = false;
		vm.gerandoCaderno = false;
		vm.gerandoCadernoDiscursiva = false;
	}
	
	function excluirPasta() {
		if (vm.itens.length) {
			tec.confirm("Deseja excluir a pasta \"" + vm.pastaAtual.nome + "\" juntamente com todas as suas questões favoritas?", null, function(confirmou) {
				if (confirmou) {
					setTimeout(function() {
						tec.confirm("Atenção: todas as questões favoritas desta pasta serão excluídas e não será mais possível recuperá-las. Confirma mesmo assim?", null, function(confirmouDeNovo) {
							if (confirmouDeNovo) {
								excluirPastaAtualSemConfirmacao();
							}
						});
					}, 0);
				}
			});
		} else {
			tec.confirm("Deseja excluir a pasta \"" + vm.pastaAtual.nome + "?", null, function(confirmou) {
				if (confirmou) {
					excluirPastaAtualSemConfirmacao();
				}
			});
		}
	}
	
	function selecionarLinha(questao) {
		if (vm.modoSelecao) {
			questao.selecionada = !questao.selecionada;
			atualizarItensSelecionados();
		}
	}
	
	function alterarExibicaoFavoritas() {
		if (vm.exibicaoLista == false) {
			vm.modoSelecao = false;
			vm.excluindoItens = false;
			vm.movendoItens = false;
			vm.gerandoCaderno = false;
			vm.gerandoCadernoDiscursiva = false;
		}
	}

	function selecionarTudo(checked) {
		$(vm.itens).each(function(index, questao) {
			questao.selecionada = checked;
		});
		atualizarItensSelecionados();
	}
	
	function possuiItensSelecionados() {
		return vm.itensSelecionados && vm.itensSelecionados.length;
	}
	
	function atualizarItensSelecionados() {
		vm.itensSelecionados = [];
		vm.itensNaoSelecionados = [];
		$(vm.itens).each(function(index, questao) {
			if (questao.selecionada) {
				vm.itensSelecionados.push(questao);
			} else {
				vm.itensNaoSelecionados.push(questao);
			}
		});
	}

	function questoesIDs() {
		var ids = [];
		$(vm.itens).each(function(index, questao) {
			ids.push(questao.idQuestao)
		});

		return ids;
	}

	function listarPastasCadernos(){
		if (tecDadosFavoritas.pastasCadernos.length == 0) {
			tecDadosFavoritas.listarPastasCadernos()
			.then(function(data) {
				tecDadosFavoritas.pastasCadernos = data.pastas;
				vm.pastasCadernos = tecDadosFavoritas.pastasCadernos;

				vm.subpastasPorPasta = {};
				$(vm.pastasCadernos).each(function(_, pasta) {
					if (!!pasta.subpastas && pasta.subpastas.length > 0) {
						vm.subpastasPorPasta[pasta.id] = ordenarSubpastas(pasta.subpastas)
					}
				});
			});
		}
	}

	function ordenarSubpastas(argumento){
	  return [].slice.call(argumento).sort(function(a,b){
		return a.nome.localeCompare(b.nome)
	  });
	}


	//private functions
	function encontrarIndice(idQuestao) {
		var retorno = null;
		$(vm.itens).each(function(index, questao) {
			if (questao.idQuestao == idQuestao) {
				retorno = index;
			}
		});
		return retorno;
	}

	function excluirPastaAtualSemConfirmacao() {
		tecDadosFavoritas.excluirPastaAtual()
		.then(function() {
			window.location.href = contextPathUrl + "questoes/favoritas";
		});
	}	
});



//////////////////////////////

module.factory("tecDadosFavoritas", function($q, tec) {
	var service = {
		pastas: null,
		pastasCadernos: [],
		pastaAtual: null,
		questoes: null,
		inicializar: inicializar,
		listarPastas: listarPastas,
		listarPastasCadernos: listarPastasCadernos,
		abrirPasta: abrirPasta,
		criarPasta: criarPasta,
		carregarMaisQuestoes: carregarMaisQuestoes,
		renomearPastaAtual: renomearPastaAtual,
		excluirPastaAtual: excluirPastaAtual,
		excluirSelecionados: excluirSelecionados,
		moverSelecionados: moverSelecionados,
		exibirBotaoCarregarMaisCadernos: false,
		_tamanho_pagina: 100
	};
	
	return service;

	function inicializar(idPastaAtual) {
		var pastaSemClassificacao = {
			id: null,
			nome: "Sem classificação"
		};
		
		return service.listarPastas()
		.then(function() {
			if (idPastaAtual == 0) {
				service.pastaAtual = pastaSemClassificacao;
				return;
			}

			service.pastaAtual = null;
			$(service.pastas).each(function(index, pasta) {
				if (pasta.id == idPastaAtual) {
					service.pastaAtual = pasta;
				}
			});
			
			if (!service.pastaAtual) {
				service.pastaAtual = pastaSemClassificacao;
			}
		});
	}
	
	function listarPastas() {
		return tec.apiGet("/pastas-favoritas")
		.then(function(data) {
			service.pastas = data.pastas;
		});
	}
	
	function abrirPasta(pasta, ordenacao, quantidade) {
		return tec.apiGet("/favoritas", { pasta: pasta.id, ordenacao: ordenacao, paginar: true, pagina: 1, quantidade: quantidade})
		.then(function(data) {
			data = data || {};
			service.pastaAtual = pasta;
			service.questoes = prepararFavoritas(data.questoes);

			if (service._tamanho_pagina >= quantidade) {
				validarExibirBotaoCarregarMaisCadernos(data.questoes);
			}
		});
	}

	function carregarMaisQuestoes(pasta, ordenacao, pagina) {
		return tec.apiGet("/favoritas", { pasta: pasta.id, ordenacao: ordenacao, paginar: true, pagina: pagina, quantidade: service._tamanho_pagina})
		.then(function(data) {
			data = data || {};
			validarExibirBotaoCarregarMaisCadernos(data.questoes);
			if (data.questoes.length > 0) {
				if (!service.questoes) {
					service.questoes = prepararFavoritas(data.questoes);
				} else {
					Array.prototype.push.apply(service.questoes, prepararFavoritas(data.questoes));
				}
				service.pastaAtual = pasta;
			}
		});
	}
	
	function validarExibirBotaoCarregarMaisCadernos(questoes) {
		if (!questoes || questoes.length < service._tamanho_pagina) {
			service.exibirBotaoCarregarMaisQuestoes = false;
		} else {
			service.exibirBotaoCarregarMaisQuestoes = true;
		}
	}

	function criarPasta(nome) {
		return tec.apiPost("/pastas-favoritas", { nome: nome })
		.catch(function(error) {
			tec.alert("Já existe uma pasta com esse nome.")
			return $q.reject(error);
		});
	}
	
	function renomearPastaAtual(nomePasta) {
		return tec.apiPut("/pastas-favoritas/" + service.pastaAtual.id, { nome: nomePasta })
		.catch(function(error) {
			tec.alert("Já existe uma pasta com esse nome.")
			return $q.reject(error);
		});
	}
	
	function excluirPastaAtual() {
		return tec.apiDelete("/pastas-favoritas/" + service.pastaAtual.id);
	}
	
	function excluirSelecionados() {
		var ids = encontrarItensSelecionados();
		
		return tec.apiPost("/favoritas/multiple-delete", { questoes: ids });
	}
	
	function moverSelecionados(pastaDestino) {
		var ids = encontrarItensSelecionados();

/*		var pastaDestino = $("#pastaDestino").val();
		if (pastaDestino == "Sem classificação") {
			pastaDestino = null;
		}
	*/	
		return tec.apiPost("/favoritas/multiple-set", { questoes: ids, pastaDestino: pastaDestino });
	}

	function listarPastasCadernos() {
		return tec.apiGet("/pastas-cadernos/", { buscarSubpastas: true });
	}
	
	//private functions
	
	function prepararFavoritas(questoes) {
		$(questoes).each(function(index, questao) {
			questao.objetiva = questao.tipo == "OBJETIVA";
		});
		return questoes;
	}
	
	function encontrarItensSelecionados() {
		var ids = [];
		$(service.questoes).each(function(index, questao) {
			if (questao.selecionada) {
				ids.push(questao.idQuestao);
			}
		});
		return ids;
	}
});

})();
