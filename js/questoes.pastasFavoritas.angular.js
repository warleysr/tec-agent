(function() {

	'use strict';

	angular
		.module("tec.questoes")
		.factory("tecDadosPastasFavorita", tecDadosPastasFavorita)
		.controller("TecPastasQuestoesFavoritasController", TecPastasQuestoesFavoritasController);

	TecPastasQuestoesFavoritasController.$inject = ['tec', 'tecDadosPastasFavorita'];

	function TecPastasQuestoesFavoritasController(tec, factory) {
   		var vm = this;

		vm.pastas = [];

		vm.criarPasta = criarPasta;
		vm.renomearPasta = renomearPasta;
		vm.excluirPasta = excluirPasta;

		ativar();

		function ativar() {
			if (!factory.pastas || !factory.pastas.length) {
				listarPastas();
			} else {
				vm.pastas = factory.pastas;
			}
		}

		function listarPastas() {
			factory.listarPastas()
				.then(function(pastas) {
					vm.pastas = pastas;
				});
		}

		function criarPasta() {
			tec.prompt("Digite o nome da pasta", "", "Criar nova pasta", function(nome) {
				if (nome && nome.length) {
					factory.criarPasta(nome)
						.then(function() {
							window.location.reload();
						});
				}
			});
		}

		function renomearPasta(pasta) {
			tec.prompt("Digite o nome da pasta", pasta.nome, "Renomear pasta", function(nome) {
				if (nome && nome.length) {
					factory.renomearPasta(pasta.id, nome)
						.then(function() {
							window.location.reload();
						});
				}
			});
		}

		function excluirPasta(pasta) {
			if (pasta.quantidadeQuestoes > 0) {
				tec.confirm("Deseja excluir a pasta \"" + pasta.nome + "\" juntamente com todas as suas questões favoritas?", null, function(confirmou) {
					if (confirmou) {
						setTimeout(function() {
							tec.confirm("Atenção: todas as questões favoritas desta pasta serão excluídas e não será mais possível recuperá-las. Confirma mesmo assim?", null, function(confirmouDeNovo) {
								if (confirmouDeNovo) {
									excluir();
								}
							});
						}, 0);
					}
				});
			} else {
				tec.confirm("Deseja excluir a pasta \"" + pasta.nome + "\"?", null, function(confirmou) {
					if (confirmou) {
						excluir();
					}
				});
			}

			function excluir() {
				factory.excluirPasta(pasta.id)
					.then(function() {
						window.location.reload();
					});
			}
		}
	}

	tecDadosPastasFavorita.$inject = ["tec"];

	function tecDadosPastasFavorita(tec) {
		var service = {
			pastas: [],

			listarPastas: listarPastas,
			criarPasta: criarPasta,
			renomearPasta: renomearPasta,
			excluirPasta: excluirPasta,
		};

		return service;

		function listarPastas() {
			return tec.apiGet("/pastas-favoritas/listar-com-total-mais-anotacoes")
				.then(function(data) {
					service.pastas = data.pastas;

					return service.pastas;
				});
		}

		function criarPasta(nome) {
			return tec.apiPost("/pastas-favoritas", { nome: nome })
				.catch(function(error) {
					tec.alert("Já existe uma pasta com esse nome.")
					return $q.reject(error);
				});
		}

		function renomearPasta(idPasta, nome) {
			return tec.apiPut("/pastas-favoritas/" + idPasta, { nome: nome })
				.catch(function(error) {
					tec.alert("Já existe uma pasta com esse nome.")
					return $q.reject(error);
				});
		}

		function excluirPasta(idPasta) {
			return tec.apiDelete("/pastas-favoritas/" + idPasta);
		}
	}
})();

