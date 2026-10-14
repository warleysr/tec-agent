(function() {

var module = angular.module("tec.questoes");

module.controller("CadernosQuestoesLixeiraCtrl", function(tecDadosCadernosLixeira, tec) {
	var vm = this;
	vm.pastas = tecDadosCadernosLixeira.pastas;
	vm.itens = tecDadosCadernosLixeira.cadernos;
	vm.totalQuestoesSelecionadas = 0;
	vm.ordenacao = "data";

	vm.listarCadernos = listarCadernos;
	vm.listarPastas = listarPastas;
	vm.recarregarPasta = recarregarPasta;
	vm.ordenar = ordenar;
	vm.ativarMoverCadernos = ativarMoverCadernos;
	vm.moverItens = moverItens;
	vm.cancelarOperacaoPasta = cancelarOperacaoPasta;
	vm.selecionarLinha = selecionarLinha;
	vm.selecionarTudo = selecionarTudo;
	vm.possuiItensSelecionados = possuiItensSelecionados;
	vm.tratarSelecionar = tratarSelecionar;
	vm.carregarMaisCadernos = carregarMaisCadernos;
	vm.lineClick = lineClick;
	vm.dados = tecDadosCadernosLixeira;
	vm.isAssinante = $.isAssinanteLogado();

	iniciar();
	
	function iniciar() {
		if (vm.itens.length == 0) {
			listarCadernos();
		}
		listarPastas();
		vm.pagina = 1;
	}
	
	function listarCadernos() {
		vm.pagina = 1;
		var ordenarPor = vm.reordenarPor || vm.ordenacao;

		tecDadosCadernosLixeira.listarItens(ordenarPor, vm.pagina)
			.then(function() {
				vm.itens = [];
				vm.itens = tecDadosCadernosLixeira.itens;
				vm.tudoSelecionado = false;
				vm.modoSelecao = false;
				vm.movendoItens = false;
				vm.ordenacao = ordenarPor;
			});
	}
	
	function carregarMaisCadernos() {
		vm.pagina += 1;
		tecDadosCadernosLixeira.carregarMais(vm.ordenacao, vm.pagina)
		.then(function() {
			vm.itens = tecDadosCadernosLixeira.itens;
			vm.tudoSelecionado = false;
			vm.modoSelecao = false;
			vm.movendoItens = false;
		});
	}
	
	function recarregarPasta() {
		vm.listarCadernos();
	}

	function ordenar(ordenacao) {
		if (vm.ordenacao == ordenacao) {
			return;
		}
		vm.reordenarPor = ordenacao;
		recarregarPasta();
	}

	function ativarMoverCadernos(caderno) {
		selecionarTudo(false);
		listarPastas();
		vm.modoSelecao = true;
		vm.movendoItens = true;
		if (caderno) {
			selecionarLinha(caderno);
		}	
	}

	function moverItens() {
		tecDadosCadernosLixeira.moverSelecionados(vm.pastaDestino, vm.subpastaDestino)
		.then(function(dados) {
			vm.recarregarPasta();
		});
	}
	
	function cancelarOperacaoPasta() {
		vm.modoSelecao = false;
		vm.movendoItens = false;
	}

	function selecionarLinha(caderno) {
		if (vm.modoSelecao) {
			caderno.selecionado = caderno.selecionado ? !caderno.selecionado : true;
			contarItensSelecionados();
		}
	}
	
	function selecionarTudo(checked) {
		vm.tudoSelecionado = checked;
		$(vm.itens).each(function(_, item) {
			if (!item.desabilitarSelecao) {
				item.selecionado = checked;
			}
		});
		contarItensSelecionados();
	}
	
	function possuiItensSelecionados() {
		return vm.cadernosSelecionados > 0;
	}

	function tratarSelecionar(item) {
		contarItensSelecionados();
	}

	function contarItensSelecionados() {
		var selecionados = 0;
		vm.totalQuestoesSelecionadas = 0;
		$(vm.itens).each(function(_, item) {
			selecionados++;
		});
		vm.cadernosSelecionados = selecionados;
	}
	
	function lineClick(caderno) {
		if (vm.modoSelecao) {
			if (caderno.desabilitarSelecao) {
				return;
			}

			caderno.selecionado = caderno.selecionado ? !caderno.selecionado : true;
			contarItensSelecionados();
		} else {
			vm.ativarMoverCadernos(caderno);
		}
	}

	//private functions

	function listarPastas(){
		if (tecDadosCadernosLixeira.pastas.length == 0) {
			tecDadosCadernosLixeira.listarPastas()
			.then(function(data) {
				tecDadosCadernosLixeira.pastas = data.pastas;
				vm.pastas = tecDadosCadernosLixeira.pastas;

				vm.subpastasPorPasta = {};
				$(vm.pastas).each(function(_, pasta) {
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

});



//////////////////////////////

module.factory("tecDadosCadernosLixeira", function($q, tec, $window) {
	var service = {
		pastas: [],
		cadernos: [],
		listarItens: listarItens,
		listarPastas: listarPastas,
		moverSelecionados: moverSelecionados,
		carregarMais: carregarMais,
		exibirBotaoCarregarMaisCadernos: false,

		_tamanho_pagina: 0
	};
	
	ativar();
	
	return service;

	function ativar() {
		service._tamanho_pagina = 0;
		if ($.isAssinanteAvancadoLogado()) {
			service._tamanho_pagina = 60;
		} else if ($.isAssinanteLogado()) {
			service._tamanho_pagina = 30;
		} else {
			tec.alert("Esta funcionalidade é exclusiva para assinantes do site. <a href='" + contextPathUrl + "assinar'>Clique aqui</a> e confira nossos planos.", "Recurso exclusivo para assinantes");
		}
	}
	
	function validarExibirBotaoCarregarMaisCadernos(cadernos) {
		if (!cadernos || cadernos.length < service._tamanho_pagina) {
			service.exibirBotaoCarregarMaisCadernos = false;
		} else {
			service.exibirBotaoCarregarMaisCadernos = true;
		}
	}

	function listarItens(ordenacao, pagina) {
		ordenacao = ordenacao || "nome";
		return tec.apiGet("/lixeira-cadernos/itens", { ordenacao: ordenacao, paginar: true, pagina: pagina })
		.then(function(data) {
			data = data || {};

			service.itens = prepararItens(data.itens, ordenacao);
			validarExibirBotaoCarregarMaisCadernos(service.itens);
		});
	}

	function carregarMais(ordenacao, pagina) {
		ordenacao = ordenacao || "nome";

		return tec.apiGet("/lixeira-cadernos/itens", { ordenacao: ordenacao, paginar: true, pagina: pagina })
		.then(function(data) {
			data = data || {};

			if (data.itens.length > 0) {
				validarExibirBotaoCarregarMaisCadernos(data.itens);
				if (!service.itens) {
					service.itens = prepararItens(data.itens);
				} else {
					Array.prototype.push.apply(service.itens, prepararItens(data.itens));
				}
			} else {
				service.exibirBotaoCarregarMaisCadernos = false;
			}
		});
	}

	function listarPastas() {
		return tec.apiGet("/pastas-cadernos/", { buscarSubpastas: true });
	}

	function moverSelecionados(pastaDestino, subpastaDestino, ids) {
		if (ids === null || typeof ids === 'undefined') {
			ids = encontrarCadernosSelecionados();
		}

		return tec.apiPost("/lixeira-cadernos/multiple-set", { cadernos: ids.cadernos, pastaDestino: pastaDestino, subpastaDestino: subpastaDestino })
			.then(function(data) {
				return { data: data };
			});
	}

	//private functions
	
	function prepararItens(itens, ordenacao) {
		$(itens).each(function(_, item) {
			item.objetivas = item.formatoQuestoes == "OBJETIVA";
		});
		return copiarDadosDeItensJaCarregados(service.itens, itens, ordenacao);
	}

	function copiarDadosDeItensJaCarregados(origem, destino, ordenacao) {
		var merged = [];
		var mapItensComDadosParaCopiar = {};

		$(origem).each(function(_, item) {
			if (item.porcentagemAcertos != undefined || (item.subpasta && item.expandido) ) {
				mapItensComDadosParaCopiar[item.id] = item;
			}
		});

		$(destino).each(function(_, item) {
			var itemComDadosParaCopiar = mapItensComDadosParaCopiar[item.id];
			var obj = itemComDadosParaCopiar ? angular.copy(itemComDadosParaCopiar) : angular.copy(item);

			// A data não deve ser mantida pois o valor dela muda de acordo com a ordenação
			obj.data = item.data;


			merged.push(obj);
		});

		return merged;
	}

	function encontrarCadernosSelecionados() {
		var ids = [];
		$(service.itens).each(function(_, item) {
			if (item.selecionado) {
				ids.push(item.idCaderno);
			}
		});

		return { cadernos: ids };
	}
});

})();
