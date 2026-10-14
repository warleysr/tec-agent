(function() {

var module = angular.module("tec.questoes");

module.controller("DiscussaoQuestoesCtrl", function($routeParams, tecDadosDiscussao) {
	var vm = angular.extend(this, {
		ordenacao: {
			RECENTES: "recentes",
			POSITIVO: "positivo",
			NEGATIVO: "negativo"
		},

		itens: null,
		filtro: $routeParams.filtro,
		ordenacaoSelecionada: null,
		dataAmigavel: dataAmigavel,
		onAlterarOrdenacao: onAlterarOrdenacao,
		buscar: buscar,
		buscaInicial: buscaInicial,
		limparBusca: limparBusca,
		valorBuscado: null
	});
	vm.pagina = 1;
	vm.proximaPagina = proximaPagina;
	vm.exibirBotaoCarregarMais = false;
	vm._tamanho_pagina = 10;
	
	ativar();
	
	function ativar() {
		vm.buscaInicial();
	}

	function buscaInicial() {
		if (vm.filtro != "minhas") {
			vm.ordenacaoSelecionada = null;
		} else {
			vm.ordenacaoSelecionada = vm.ordenacao.RECENTES;
		}
		
		vm.itens = null;
		vm.pagina = 1;
		vm.valorBusca = '';
		vm.valorBuscado = null;

		tecDadosDiscussao.buscarDiscussoes(vm.filtro, vm.pagina, vm.ordenacaoSelecionada)
		.then(function(discussoes) {
			vm.itens = discussoes
			validarExibirBotaoCarregarMais(discussoes);
		})
	}

	function dataAmigavel(data) {
		return moment(data, "DD/MM/YYYY HH:mm").fromNow();
	}
	
	function onAlterarOrdenacao(ordenacao) {
		vm.ordenacaoSelecionada = ordenacao;
		vm.pagina = 1;

		tecDadosDiscussao.buscarDiscussoes(vm.filtro, vm.pagina, vm.ordenacaoSelecionada, vm.valorBusca)
			.then(function(discussoes) {
				for (var i in discussoes) {
					discussoes[i].ultimoPost = destacar(discussoes[i].ultimoPost, vm.valorBuscado);
				}

				vm.itens = discussoes
				validarExibirBotaoCarregarMais(discussoes);
			});
	}
	
	function buscar() {
		vm.pagina = 1;
		tecDadosDiscussao.buscarDiscussoes(vm.filtro, vm.pagina, vm.ordenacaoSelecionada, vm.valorBusca)
		.then(function(discussoes) {
			vm.valorBuscado = vm.valorBusca;

			for (var i in discussoes) {
				discussoes[i].ultimoPost = destacar(discussoes[i].ultimoPost, vm.valorBuscado);
			}

			vm.itens = discussoes
			validarExibirBotaoCarregarMais(discussoes);
		});
	}

	function destacar(comentario, busca) {
		var regEx = new RegExp(busca, "ig");
		return comentario.replace(regEx, '<span class="destacar-busca">' + busca + '</span>');
	}

	function limparBusca() {
		vm.buscaInicial();
	}

	function proximaPagina() {
		vm.pagina++;
		tecDadosDiscussao.buscarDiscussoes(vm.filtro, vm.pagina, vm.ordenacaoSelecionada, vm.valorBusca)
		.then(function(discussoes) {
			for (var i in discussoes) {
				var discussao = discussoes[i];
				
				// listagem de populares contém duplicadas as vezes
				if (!containsComentario(vm.itens, discussao)) {
					discussao.ultimoPost = destacar(discussao.ultimoPost, vm.valorBuscado);
					vm.itens.push(discussao);
				}
			}
			validarExibirBotaoCarregarMais(discussoes);
		})
	}
	
	function containsComentario(discussoes, discussao) {
		for (var i in discussoes) {
			var discussaoAtual = discussoes[i];
			
			if (discussaoAtual.codigoComentarioAluno == discussao.codigoComentarioAluno) {
				return true;
			}
		}
		
		return false;
	}
	
	function validarExibirBotaoCarregarMais(discussoes) {
		if (!discussoes || discussoes.length < vm._tamanho_pagina) {
			vm.exibirBotaoCarregarMais = false;
		} else {
			vm.exibirBotaoCarregarMais = true;
		}
	}

});



//////////////////////////////

module.factory("tecDadosDiscussao", function(tec) {
	var service = {
		buscarDiscussoes: buscarDiscussoes
	};
	return service;
	
	function buscarDiscussoes(filtro, pagina, ordenacao, busca) {
		return tec.apiGet("/discussoes", { filtro: filtro, pagina: pagina, ordenacao: ordenacao, busca: busca})
		.then(function(data) {
			return data.discussoes;
		})
	}
});

})();
