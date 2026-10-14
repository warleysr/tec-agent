(function() {

var MOUNT_ID = "react-root-questao";

var EXIBICAO_DEFAULTS = {
	tema: "default",
	espacamento: 3,
	tamanhoFonte: 0
};

var LINE_ENUNCIADO = { "1": "1.4rem", "2": "1.56rem", "3": "1.75rem", "4": "2rem" };
var LINE_ALTERNATIVA = { "1": "1.3rem", "2": "1.4rem", "3": "1.6rem", "4": "2rem" };
var ALT_PADDING = { "1": "0.3rem", "2": "0.3rem", "3": "0.5rem", "4": "0.5rem" };

var DARK_HOST_TOKENS = {
	"--tec-exibicao-bg": "#242525",
	"--tec-exibicao-fg": "#d4cfc5",
	"--tec-exibicao-header-bg": "#2d2e2d",
	"--tec-exibicao-border": "#454647",
	"--tec-exibicao-footer-bg": "#242525",
	"--tec-exibicao-link-id": "#6eacd1",
	"--tec-exibicao-link-meta": "#c0baae",
	"--tec-exibicao-alt-bg": "#262727",
	"--tec-exibicao-alt-border": "#454647",
	"--tec-exibicao-alt-correta-bg": "#2b3d21",
	"--tec-exibicao-alt-errada-bg": "#3a201f",
	"--tec-exibicao-letra-bg": "#242525",
	"--tec-exibicao-letra-border": "#b0b5b5",
	"--tec-exibicao-letra-fg": "#b0b5b5",
	"--tec-exibicao-ta-link": "#da7533",
	"--tec-exibicao-feedback-fg": "#d4cfc5",
	"--tec-exibicao-feedback-gabarito-fg": "#d4cfc5",
	"--tec-exibicao-feedback-resolucao": "#6eacd1",
	"--tec-exibicao-box-warning-bg": "#ffe071",
	"--tec-exibicao-box-warning-fg": "#333"
};

var exibicaoState = {
	tema: EXIBICAO_DEFAULTS.tema,
	espacamento: EXIBICAO_DEFAULTS.espacamento,
	tamanhoFonte: EXIBICAO_DEFAULTS.tamanhoFonte
};

var exibicaoSubscriptionsBound = false;
var lastVmForExibicao = null;

function clampEspacamento(value) {
	var n = parseInt(value, 10);
	if (isNaN(n) || n < 1) return 1;
	if (n > 4) return 4;
	return n;
}

function detectTema() {
	if (typeof tema === "string" && (tema === "dark" || tema === "default")) {
		return tema;
	}
	if (typeof verificarTema === "function") {
		return verificarTema() === "dark" ? "dark" : "default";
	}
	return EXIBICAO_DEFAULTS.tema;
}

function readExibicaoFromLocalStorage() {
	try {
		var raw = localStorage.getItem($.chaveLocalStorageConfigUsuario);
		if (!raw) return;
		var config = JSON.parse(raw);
		if (config.espacamento) {
			exibicaoState.espacamento = clampEspacamento(config.espacamento);
		}
		if (config.tamanhoFonte !== undefined && config.tamanhoFonte !== null) {
			exibicaoState.tamanhoFonte = parseFloat(config.tamanhoFonte) || 0;
		}
	} catch (e) {}
}

function applyExibicaoToHost(el, estado) {
	var n = String(clampEspacamento(estado.espacamento));
	var fonteDelta = (typeof estado.tamanhoFonte === "number" ? estado.tamanhoFonte : 0) + "rem";

	el.setAttribute("data-tec-tema", estado.tema);
	el.setAttribute("data-tec-espacamento", n);
	el.setAttribute("data-tec-tamanho-fonte", String(estado.tamanhoFonte));

	el.style.setProperty("--tec-exibicao-tema", estado.tema);
	el.style.setProperty("--tec-exibicao-espacamento", n);
	el.style.setProperty("--tec-exibicao-fonte-delta", fonteDelta);
	el.style.setProperty("--tec-exibicao-line-enunciado", LINE_ENUNCIADO[n] || LINE_ENUNCIADO["3"]);
	el.style.setProperty("--tec-exibicao-line-alternativa", LINE_ALTERNATIVA[n] || LINE_ALTERNATIVA["3"]);
	el.style.setProperty("--tec-exibicao-alt-padding", ALT_PADDING[n] || ALT_PADDING["3"]);

	if (estado.tema === "dark") {
		for (var key in DARK_HOST_TOKENS) {
			if (Object.prototype.hasOwnProperty.call(DARK_HOST_TOKENS, key)) {
				el.style.setProperty(key, DARK_HOST_TOKENS[key]);
			}
		}
	} else {
		for (var darkKey in DARK_HOST_TOKENS) {
			if (Object.prototype.hasOwnProperty.call(DARK_HOST_TOKENS, darkKey)) {
				el.style.removeProperty(darkKey);
			}
		}
	}
}

function applyExibicaoEnunciadoDark() {
	if (detectTema() !== "dark") return;

	var mount = document.getElementById(MOUNT_ID);
	if (!mount || !window.jQuery) return;

	var $ = window.jQuery;
	var $enunciado = $(mount).find("[data-tec-enunciado]");
	if (!$enunciado.length) return;

	$enunciado.addClass("embonitar dark");
	$enunciado.css("filter", "invert(1)");
	$enunciado.find("img").css("filter", "invert(1)");

	if (typeof $.fn.ajustarTemaDark === "function") {
		$enunciado.ajustarTemaDark(["#333", "#3498db", "#e74c3c", "#27AE60", "#f39c12"]);
	}
}

function syncExibicaoHost(vm) {
	if (!document.getElementById(MOUNT_ID)) return;

	var mount = document.getElementById(MOUNT_ID);
	if (!mount) return;

	exibicaoState.tema = detectTema();
	applyExibicaoToHost(mount, exibicaoState);

	if (vm) {
		lastVmForExibicao = vm;
	}
}

function loadInitialExibicao(vm) {
	exibicaoState.tema = detectTema();
	readExibicaoFromLocalStorage();

	if (typeof $.obterConfiguracaoUsuario === "function") {
		$.obterConfiguracaoUsuario()
			.then(function(config) {
				if (config.tamanhoFonte !== undefined && config.tamanhoFonte !== null) {
					exibicaoState.tamanhoFonte = parseFloat(config.tamanhoFonte) || 0;
				}
				if (config.espacamento) {
					exibicaoState.espacamento = clampEspacamento(config.espacamento);
				}
				syncExibicaoHost(vm);
			})
			.catch(function() {
				syncExibicaoHost(vm);
			});
	} else {
		syncExibicaoHost(vm);
	}
}

function bindExibicaoSubscriptions() {
	if (exibicaoSubscriptionsBound || !$.Topic) return;
	exibicaoSubscriptionsBound = true;

	$.Topic("tamanho-fonte-alterado").subscribe(function(data) {
		if (!data || typeof data.quantidade !== "number") return;
		exibicaoState.tamanhoFonte = parseFloat(
			(exibicaoState.tamanhoFonte + data.quantidade).toFixed(2)
		);
		syncExibicaoHost(lastVmForExibicao);
	});

	$.Topic("espacamento-alterado").subscribe(function(data) {
		if (!data || data.espacamento === undefined) return;
		exibicaoState.espacamento = clampEspacamento(data.espacamento);
		syncExibicaoHost(lastVmForExibicao);
	});

	$.Topic("tema-alterado").subscribe(function() {
		exibicaoState.tema = detectTema();
		syncExibicaoHost(lastVmForExibicao);
	});
}

angular.module("tec.questao").factory("tecQuestaoEmbed", ["$timeout", function($timeout) {

	var mounted = false;
	/** Evita loop: um reload por episódio de mount vazio (plano empty-mount-reload-once). */
	var SS_EMPTY_MOUNT_RELOAD = "tecEmbedEmptyMountReload";
	var EMPTY_CHECK_DELAY_MS = 150;

	function clearEmptyMountReloadFlag() {
		try {
			if (sessionStorage.getItem(SS_EMPTY_MOUNT_RELOAD) === "1") {
				sessionStorage.removeItem(SS_EMPTY_MOUNT_RELOAD);
			}
		} catch (e) {}
	}

	/** Libera flag após load estável (não dispara reload). */
	clearEmptyMountReloadFlag();

	function readJspFlags() {
		var el = document.getElementById(MOUNT_ID);
		if (!el) {
			return null;
		}
		return {
			exibirBotoesTrocarTopico: el.getAttribute("data-exibir-botoes-trocar-topico") === "true",
			cadernoQuestoes: el.getAttribute("data-caderno-questoes") === "true"
		};
	}

	function isEmbedActive() {
		return !!document.getElementById(MOUNT_ID);
	}

	function hasEmbedBody(mountEl) {
		if (!mountEl) {
			return false;
		}
		if (mountEl.querySelector(".embed-questao")) {
			return true;
		}
		if (mountEl.querySelector("[data-embed-root]")) {
			return true;
		}
		if (mountEl.getAttribute("data-embed-root")) {
			return true;
		}
		return !!(mountEl.children && mountEl.children.length > 0);
	}

	/**
	 * Só no modo embed React: se o corpo sumiu após mount/update, um único reload.
	 * Backend decide React vs legado. Não aplica ao HTML legado (sem #react-root-questao).
	 */
	function ensureEmbedBodyOrReloadOnce() {
		if (!isEmbedActive()) {
			return;
		}
		setTimeout(function() {
			if (!isEmbedActive()) {
				return;
			}
			var el = document.getElementById(MOUNT_ID);
			if (hasEmbedBody(el)) {
				return;
			}
			try {
				if (sessionStorage.getItem(SS_EMPTY_MOUNT_RELOAD) === "1") {
					return;
				}
				sessionStorage.setItem(SS_EMPTY_MOUNT_RELOAD, "1");
			} catch (e) {
				return;
			}
			window.location.reload();
		}, EMPTY_CHECK_DELAY_MS);
	}

	function buildHostContext(vm, jspFlags) {
		jspFlags = jspFlags || readJspFlags() || {};
		var context = {
			contextPath: (typeof contextPathUrl === "string" ? contextPathUrl : "").replace(/\/$/, ""),
			navegacao: vm.navegacao,
			ocultarNavegacao: vm.ocultarNavegacao,
			exibirBotoesTrocarTopico: jspFlags.exibirBotoesTrocarTopico === true,
			navegacaoAvancada: vm.navegacaoAvancada,
			botaoDesfazerHabilitado: vm.botaoDesfazerHabilitado,
			botaoFavoritaHabilitado: vm.caderno && vm.caderno.botaoFavoritaHabilitado,
			botaoAnotadaHabilitado: vm.caderno && vm.caderno.botaoAnotadaHabilitado,
			usuarioLogado: !vm.deslogado,
			complementoAberto: vm.questao && vm.questao.complemento,
			aguardandoResolucao: vm.aguardandoResolucao,
			isMobile: vm.isMobile,
			habilitaSwipe: vm.habilitaSwipe,
			esconderIrPara: vm.esconderIrPara,
			exibirConcurso: vm.exibirConcurso,
			modoExibicaoComentario: vm.modoExibicaoComentario,
			modoExibicaoForum: vm.modoExibicaoForum,
			telaDesktop: vm.telaDesktop,
			exibicao: {
				tema: exibicaoState.tema,
				espacamento: exibicaoState.espacamento,
				tamanhoFonte: exibicaoState.tamanhoFonte
			}
		};

		if (vm.caderno && typeof vm.caderno.numeroQuestaoAtual === "number") {
			context.indiceQuestaoAtual = vm.caderno.numeroQuestaoAtual - 1;
			context.navegacaoCaderno = true;
		} else if (typeof vm.indiceQuestaoAtual === "number") {
			context.indiceQuestaoAtual = vm.indiceQuestaoAtual;
		}

		if (vm.caderno && typeof vm.caderno.numeroTotalQuestoes === "number") {
			context.totalQuestoes = vm.caderno.numeroTotalQuestoes;
		} else if (vm.questoes && vm.questoes.length) {
			context.totalQuestoes = vm.questoes.length;
		}

		if (typeof vm.estaNoApp === "function") {
			context.estaNoApp = vm.estaNoApp();
		}

		return context;
	}

	function buildProps(vm, jspFlags) {
		return {
			questoes: [vm.questao],
			indiceInicial: 0,
			hostContext: buildHostContext(vm, jspFlags)
		};
	}

	function bindVm(vm) {
		window.vm = vm;
		lastVmForExibicao = vm;
	}

	function clearVm(vm) {
		if (window.vm === vm) {
			window.vm = undefined;
		}
		if (lastVmForExibicao === vm) {
			lastVmForExibicao = null;
		}
	}

	function mount(vm, jspFlags) {
		if (!isEmbedActive()) {
			return;
		}
		if (!window.ReactComponents || !vm.questao) {
			ensureEmbedBodyOrReloadOnce();
			return;
		}

		bindExibicaoSubscriptions();
		bindVm(vm);
		syncExibicaoHost(vm);
		window.ReactComponents.mount(MOUNT_ID, buildProps(vm, jspFlags));
		mounted = true;
		loadInitialExibicao(vm);
		ensureEmbedBodyOrReloadOnce();
	}

	function update(vm, jspFlags) {
		if (!isEmbedActive()) {
			return;
		}
		if (!window.ReactComponents || !vm.questao) {
			ensureEmbedBodyOrReloadOnce();
			return;
		}

		bindExibicaoSubscriptions();
		bindVm(vm);
		syncExibicaoHost(vm);

		if (!mounted) {
			mount(vm, jspFlags);
			return;
		}

		window.ReactComponents.updateProps(MOUNT_ID, buildProps(vm, jspFlags));
		ensureEmbedBodyOrReloadOnce();
	}

	function unmount(vm) {
		clearVm(vm);

		if (mounted && window.ReactComponents && window.ReactComponents.unmount) {
			window.ReactComponents.unmount(MOUNT_ID);
		}

		mounted = false;
	}

	/** MathJax 2 (Hub) e 3 (typesetPromise) — legado usa 2.7.1 via plugin-mathjax.tag */
	function typesetMathInEmbed(rootEl) {
		if (!rootEl || !window.MathJax) {
			return;
		}

		if (typeof window.MathJax.typesetPromise === "function") {
			window.MathJax.typesetPromise([rootEl]).catch(function() {});
			return;
		}

		if (window.MathJax.Hub) {
			if (window.jQuery && typeof window.jQuery.fn.configLatex === "function") {
				window.jQuery(rootEl).configLatex();
			} else {
				window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub, rootEl]);
			}
		}
	}

	/** Replica tec-visualizacao-imagem para conteúdo renderizado pelo React */
	function initViewerJsInEmbed(rootEl) {
		if (!rootEl || typeof window.Viewer === "undefined") {
			return;
		}

		var imagens = rootEl.querySelectorAll("img");
		for (var i = 0; i < imagens.length; i++) {
			var imagem = imagens[i];
			if (imagem.getAttribute("data-viewer-embed-init") === "true") {
				continue;
			}
			imagem.setAttribute("data-viewer-embed-init", "true");
			if (window.jQuery) {
				window.jQuery(imagem).on("click", function(e) {
					e.preventDefault();
				});
			}
			imagem.style.cursor = "zoom-in";
			new window.Viewer(imagem, {
				navbar: false,
				title: false,
				toolbar: false
			});
		}
	}

	function applyPostRenderPlugins() {
		var rootEl = document.getElementById(MOUNT_ID);
		if (!rootEl) {
			return;
		}
		typesetMathInEmbed(rootEl);
		initViewerJsInEmbed(rootEl);
		applyExibicaoEnunciadoDark();
	}

	function syncAfterQuestaoLoad(vm) {
		if (!isEmbedActive()) {
			return;
		}

		$timeout(function() {
			update(vm);
			$timeout(function() {
				applyPostRenderPlugins();
			}, 0);
		});
	}

	function syncComplemento(vm) {
		if (!isEmbedActive()) {
			return;
		}

		$timeout(function() {
			update(vm);
			$timeout(function() {
				applyPostRenderPlugins();
			}, 0);
		}, 0);
	}

	return {
		isEmbedActive: isEmbedActive,
		mount: mount,
		update: update,
		unmount: unmount,
		syncAfterQuestaoLoad: syncAfterQuestaoLoad,
		syncComplemento: syncComplemento,
		syncExibicaoHost: syncExibicaoHost,
		bindVm: bindVm,
		clearVm: clearVm
	};
}]);

})();
