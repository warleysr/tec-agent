(function() {

var module = angular.module("tec.common", []);

module.factory("tec", function($http, $q) {
	var service = {
		makeUrl: makeUrl,
		apiGet: apiGet,
		apiPost: apiPost,
		apiPut: apiPut,
		apiDelete: apiDelete,
		apiAdmGet: apiAdmGet,
        apiAdmPost: apiAdmPost,
        apiAdmPut: apiAdmPut,
        apiAdmDelete: apiAdmDelete,
		http: http,
		scroll: scroll,
		trim: trim,
		trimHtml: trimHtml,
		stringLike: stringLike,
		removeLinks: removeLinks,
		stringLikeForFilter: stringLikeForFilter,
		stringContainsLike: stringContainsLike,
		defaultDirective: defaultDirective,
		multiline: multiline,
		alert: $.alerts.alert, //message, title, callback
		confirm: $.alerts.confirm, //message, title, callback
		prompt: $.alerts.prompt,  //message, value, title, callback
		habilitarSelecao: habilitarSelecao,
		desabilitarSelecao: desabilitarSelecao,
		exibirFullScreen: exibirFullScreen,
		sairFullScreen: sairFullScreen,
		estaEmFullScreen: estaEmFullScreen,
		isMobile: isMobile,
		isLogado: isLogado,
		mensagemCompartilhamento: mensagemCompartilhamento,
		addLocalCache: addLocalCache,
		getLocalCache: getLocalCache, 
		clearExpiredLocalCache: clearExpiredLocalCache,
		showProcessingOverlay: showProcessingOverlay,
		hideProcessingOverlay: hideProcessingOverlay,
		requests: {}
	};
	return service;
	
	function makeUrl(url) {
		return $.getUrl(url);
	}
	
	function apiGet(url, params) {
		return apiInvoke("get", url, params);
	}
	
	function apiPost(url, params, config) {
		return apiInvoke("post", url, params, config);
	}
	
	function apiPut(url, params) {
		var invokeParams = $.extend({}, params, { "_method": "put" });
		return apiInvoke("post", url, invokeParams);
	}
	
	function apiDelete(url, params) {
		var invokeParams = $.extend({}, params, { "_method": "delete" });
		return apiInvoke("post", url, invokeParams);
	}

	function apiInvoke(method, url, params, config) {
		url = "/api" + (url.charAt(0) == "/" ? url : "/" + url);
		url = makeUrl(url);
		return http(method, url, params, config);
	}

	function apiAdmGet(url, params) {
		return apiAdmInvoke("get", url, params);
	}

	function apiAdmPost(url, params) {
		return apiAdmInvoke("post", url, params);
	}

	function apiAdmPut(url, params) {
		var invokeParams = $.extend({}, params, { "_method": "put" });
		return apiAdmInvoke("post", url, invokeParams);
	}

	function apiAdmDelete(url, params) {
		var invokeParams = $.extend({}, params, { "_method": "delete" });
		return apiAdmInvoke("post", url, invokeParams);
	}

	function apiAdmInvoke(method, url, params) {
		url = "/area-restrita/api" + (url.charAt(0) == "/" ? url : "/" + url);
		url = makeUrl(url);
		return http(method, url, params);
	}

	function http(method, url, params, extraConfig) {
		// Permite cancelar a requisição em andamento passando extraConfig.timeout
		// (uma promise resolvida quando a requisição deve ser abortada).
		var cancelavel = !!(extraConfig && extraConfig.timeout);
		var idRequest = null;
		if (params && params["requestId"]) {
			idRequest = params["requestId"];

			if (idRequest && service.requests[idRequest]) {
				return Promise.reject("Requisição duplicada");
			} else if (idRequest) {
				service.requests[idRequest] = true;
			}
		}

		var ocultarLoading = (params && params.ocultarLoading);
		if (ocultarLoading) {
			delete params.ocultarLoading;
		} else {
			$.exibirAjaxLoading();
		}

		var ocultarErros = (params && params.ocultarErros);
		if (ocultarErros) {
			delete params.ocultarErros;
		}
		
		var config = {
			headers: {
				"Accept": "application/json, text/plain, * / *",
				"If-Modified-Since": 'Mon, 26 Jul 1997 05:00:00 GMT',
				"Cache-Control": 'no-cache',
				"Pragma": 'no-cache',
				"Logado": $.isLogado()
			},
			transformRequest: function(data) {
				if (!data) {
					return data;
				}
				return $.param(data);
			}
		};

		if (cancelavel) {
			config.timeout = extraConfig.timeout;
		}

		var promise;
		if (method == "get") {
			config.params = params;
			promise = $http[method](url, config);
		} else {
			config.headers["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
			promise = $http[method](url, params, config);
		}
		
		if (typeof this.promises == 'undefined') {
			this.promises = [];
		}
		this.promises.push(promise);
		
		return promise.then(function(response) {
			var requisicaoPendente = false;
			for (var i = 0; i < this.promises.length; i++) {
				if (this.promises[i].$$state.status === 0 
						|| this.promises[i].$$state.status === -1) {
					// possui requisição pendente
					requisicaoPendente = true;
					break;
				} else {
					this.promises.splice(i, 1);
					i--;
				}
			}
			if (idRequest) {
				service.requests[idRequest] = false;
			}
			if (!requisicaoPendente) {
				this.promises = undefined;
				$.ocultarAjaxLoading();			
			}
			return response.data;
		}).catch(function(error) {
			if (idRequest) {
				service.requests[idRequest] = false;
			}
			$.ocultarAjaxLoading();
			// Requisição cancelada intencionalmente (abort via timeout): não é erro.
			if (cancelavel && (error.status === -1 || error.status === 0)) {
				return $q.reject(error);
			}
			if (error.status !== 400) {
				if (!ocultarErros) {
					$.tratarErrosAjax(error.status, error);
				}
				if (error.status === 429) {
					return $q.reject(error);
				}
			} else {
				return $q.reject(error);
			}
		});
	}
	
	function scroll(element, config) {
		config = config || {};
		element = $(element || ".auto-scroll");
		
		var scroll = false;
		if (config.dontScrollIfIntoView) {
			scroll = !element.isScrolledIntoView();
		} else {
			scroll = true;
		}
		
		if (scroll) {
			element.scrollToElement({ skipAnimation: true, scrollToBottom: config.scrollToBottom });
		}
	}
	
	function trim(string) {
		return $.trim(string);
	}
	
	function trimHtml(html) {
		if (html === null || typeof html === 'undefined') {
			return '';
		}
		var trim = html.replace(/<p><br><\/p>/gi, '');
		return trim;
	}
	
	function removeLinks(html) {
		if (html === null || typeof html === 'undefined') {
			return '';
		}
		var noLinks = html.replace(/<a/gi, '<span').replace(/<\/a/gi, '</span');
		
		return noLinks;
	}
	
	function stringLike(string, string2) {
		return $.removerNaoAscii(string.toLowerCase()) == $.removerNaoAscii(string2.toLowerCase());
	}

	function stringLikeForFilter(actual, expected) {
		actual = $.removerNaoAscii(actual.toLowerCase());
		expected = $.removerNaoAscii(expected.toLowerCase());
		return actual.indexOf(expected) > -1;
	}
	
	function stringContainsLike(string, string2) {
		return $.stringContains($.removerNaoAscii(string.toLowerCase()), $.removerNaoAscii(string2.toLowerCase()));
	}

	function defaultDirective(directive) {
		directive.restrict = directive.restrict || "E";
		directive.bindToController = directive.bindToController || true;
		directive.controller = directive.controller || function() {};
		directive.controllerAs = directive.controllerAs || "vm";
		directive.scope = directive.scope || {};
		directive.replace = directive.replace != null ? directive.replace : true;
		
		return directive;
	}
	
	function multiline(f) {
		return f.toString().split("\n").slice(1, -1).join("\n");
	}

	function desabilitarSelecao() {
		//TEC-1574 - Liberar seleção de comentários e teoria
		//angular.element(document.body).addClass('noselect');
	}

	function habilitarSelecao() {
		//TEC-1574 - Liberar seleção de comentários e teoria
		//angular.element(document.body).removeClass('noselect');
	}
	
	function exibirFullScreen(element) {
	  if(element.requestFullscreen) {
	    element.requestFullscreen();
	  } else if(element.mozRequestFullScreen) {
	    element.mozRequestFullScreen();
	  } else if(element.webkitRequestFullscreen) {
	    element.webkitRequestFullscreen();
	  } else if(element.msRequestFullscreen) {
	    element.msRequestFullscreen();
	  }
	}
	
	function sairFullScreen() {
		if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement) {
			if(document.exitFullscreen) {
				try {
					document.exitFullscreen();
				} catch(err) {
					console.warn("Error attempting to enable full-screen mode: %s %s", err.name, err.message);
				}
			} else if(document.mozCancelFullScreen) {
				document.mozCancelFullScreen();
			} else if(document.webkitExitFullscreen) {
				document.webkitExitFullscreen();
			}
		}
	}
	
	function estaEmFullScreen() {
		var fullscreenEnabled = document.fullScreen || document.mozFullScreen || document.webkitIsFullScreen;
		return fullscreenEnabled;
	}

	function isMobile() {
		var isMobile = false;
		// device detection
		if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
		    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) {
			isMobile = true;
		}
		return isMobile;
	}
	
	function isLogado() {
		return $("#logado-site").val() == "true";
	}
	
	function mensagemCompartilhamento(urlCurta, url) {
		if (url == '' || url == undefined) {
			url = urlCurta;
		}
		var s3Conteudo = s3Url.conteudo;
		var iframe = "<script src=&quot;" + s3Conteudo + "/tec-iframe/Tec-iframeResizer.js&quot;></script> "+
					 "<iframe class=&quot;tec-iframe&quot; width=&quot;800px&quot; height=&quot;600px&quot; scrolling=&quot;no&quot; frameborder=&quot;0&quot; src=&quot;" + url + "&quot;></iframe> " +
					 "<script>tecIframe()</script> ";
		var mensagem = "Copie o link abaixo e cole para o destinatário:<br/><input type='text' value='" + urlCurta + "' style='width: 100%' onclick='this.select()' />" +
		"<br /> <br /> <p>" +
		  "<button class='btn btn-primary' type='button' data-toggle='collapse' data-target='#linkIframe' aria-expanded='false' aria-controls='linkIframe'>" +
		    "Incorporar" +
		  "</button>" +
		"</p>" +
		"<div class='collapse' id='linkIframe'>" +
		  "<div class='card card-body'>" +
		    "<br/><input type='text' value='" + iframe + "' style='width: 100%' onclick='this.select()' />" +
		  "</div>" +
		"</div>";
		return mensagem;
	}
	
	/** Cache Local **/
	function addLocalCache(key, value, ttlMinutes) {
		const now = new Date();
		const item = {
			value: value,
			expiry: now.getTime() + (60000 * ttlMinutes) 
		}
		localStorage.setItem(key + "["+userId+"]", JSON.stringify(item));
	}
	
	function getLocalCache(key) {
		const itemStr = localStorage.getItem(key + "["+userId+"]");
		// se o item nao existe, retorna null
		if (!itemStr) {
			return null;
		}
		const item = JSON.parse(itemStr);
		const now = new Date();
		if (now.getTime() > item.expiry) {
			// se expirou, remove e retorna null
			localStorage.removeItem(key + "["+userId+"]")
			return null;
		}
		return item.value;
	}
	
	function clearExpiredLocalCache() {
		var toRemove = [],                      // Itens para serem removidos
	    currentDate = new Date().getTime(); // Data atual em milissegundos
		
		for (var i = 0, j = localStorage.length; i < j; i++) {
			var key = localStorage.key(i);
			var value = localStorage.getItem(key);
		
		   	// Verifica se o formato do item para evitar conflitar com outras aplicações
		   	if (value && value[0] === "{" && value.slice(-1) === "}") {
		
				// Decodifica de volta para JSON
				var current = JSON.parse(value);
				
				if (current.expiry && current.expiry <= currentDate) {
					toRemove.push(key);
				}
		   	}
		}
		
		// Remove itens expirados
		for (var i = toRemove.length - 1; i >= 0; i--) {
		    localStorage.removeItem(toRemove[i]);
		}
	}
	
	function showProcessingOverlay(titulo, subTitulo) {
		// Create overlay div
        const overlay = document.createElement('div');
        overlay.classList.add('overlay');
        overlay.id = 'processingOverlay';

        // Create spinner div
        const spinner = document.createElement('div');
        spinner.classList.add('spinner');
        overlay.appendChild(spinner);

        // Create main message div
        const message = document.createElement('div');
        message.classList.add('overlay-message');
        message.textContent = titulo;
        overlay.appendChild(message);

		if (subTitulo) {
	        // Create subtext div
	        const subtext = document.createElement('div');
	        subtext.classList.add('overlay-subtext');
	        subtext.textContent = subTitulo;
	        overlay.appendChild(subtext);
		}

        // Append overlay to the body
        document.body.appendChild(overlay);
	}
	
	function hideProcessingOverlay() {
		const overlay = document.getElementById('processingOverlay');
        if (overlay) {
            overlay.remove();
        }
	}
});

module.directive("tecCarregarTeoriaS3", function($timeout) {
	return {
		restrict: "A",
		link: function(scope, element, attributes) {
			$timeout(function() {
				var params = {};
				params.callbackCapituloCarregado = function(element) {
					$(element).addClass("capituloCarregado");
				}
				$(element).carregarTeoriaS3(params);
			});
		}
	};
});

module.directive("tecFixarScrollComplemento", function($timeout) {
	return {
		restrict: "A",
		scope: {
			fixarScrollApos: "=",
			modoExibicaoComplementoCodigo: "="
		},
		link: function(scope, element, attributes) {
			scope.$watch("fixarScrollApos", function(carregou) {
				if (carregou == true) {
					$timeout(function() {				
						var params = scope.$eval(attributes.tecFixarScrollComplemento);
						if (Array.isArray(params.containerVizinho)) {
							params.containerVizinho.forEach(function(containerVizinhoIt) {
								var containerVizinhoElemento = buscarElemento(containerVizinhoIt);
								if (containerVizinhoElemento.length > 0) {									
									params.containerVizinhoElemento = containerVizinhoElemento;	
								}
							});
						} else {
							var containerVizinhoElemento = buscarElemento(params.containerVizinho);
							params.containerVizinhoElemento = containerVizinhoElemento;								
						}
						
						$(element).fixarScrollComplementoAoLado(params, scope.modoExibicaoComplementoCodigo);										
					}, 10);
				}
			});
			
			scope.$watch("modoExibicaoComplementoCodigo", function(modoExibicaoComplementoCodigo) {
				var params = scope.$eval(attributes.tecFixarScrollComplemento);
				
				if (Array.isArray(params.containerVizinho)) {
					params.containerVizinho.forEach(function(containerVizinhoIt) {
						var containerVizinhoElemento = buscarElemento(containerVizinhoIt);
						if (containerVizinhoElemento.length > 0) {									
							params.containerVizinhoElemento = containerVizinhoElemento;	
						}
					});
				} else {
					var containerVizinhoElemento = buscarElemento(params.containerVizinho);
					params.containerVizinhoElemento = containerVizinhoElemento;								
				}
				var segundoContainer = params.containerVizinhoElemento;
				if (!segundoContainer) {
					return;
				}
				if (modoExibicaoComplementoCodigo != 'AO_LADO') {
					segundoContainer.css({overflowY: 'unset'});
					$(element).css({overflowY: 'unset'});
					segundoContainer.css({height: 'unset'});
					$(element).css({height: 'unset'});
				} else if (scope.fixarScrollApos == true) {
					$timeout(function() {				
						$(element).fixarScrollComplementoAoLado(params, scope.modoExibicaoComplementoCodigo);
					}, 10);
				}
			});
		}
	};
	
	function buscarElemento(selector) {
		var elemento = $("#" + selector);
		if (!elemento.length) {
			elemento = $("." + selector);
		}
		return elemento;
	}
});

module.directive("tecFlutuar", function($timeout) {
	return {
		restrict: "A",
		link: function(scope, element, attributes) {
			$timeout(function() {
				var params = scope.$eval(attributes.tecFlutuar);
				if (params.ancora) {
					params.ancora = buscarElemento(params.ancora);
				}
				if (params.vizinho) {
					params.vizinho = buscarElemento(params.vizinho);
				}
				
				$(element).configurarElementoVoador(params);
				setTimeout(function() {
					$(window).scroll();					
				}, 100);
			});
		}
	};

	function buscarElemento(selector) {
		var elemento = $("#" + selector);
		if (!elemento.length) {
			elemento = $("." + selector);
		}
		return elemento;
	}
});

module.factory("tecFlutuarFunctions", function(tec) {
	var service = {
		refreshScroll: refreshScroll
	};
	return service;
	
	function refreshScroll() {
		$(window).scroll().resize();
	}
});

module.directive("tecTooltip", function(){
	return {
		restrict: "A",
		link: function(scope, element, attributes) {
			//Bug no safari. Nao funciona direito o tooltip por isso: https://developer.mozilla.org/en-US/docs/Web/Events/click#Safari_Mobile
			var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
			if (!iOS) {
				element = $(element);
				if (attributes.tecTooltip) {
					attributes.$observe("tecTooltip", function() {
						element.tooltip("destroy").attr("title", attributes.tecTooltip);
					});
				}
				element.attr("data-container", "body");
				element.hover(function() {
					element.tooltip("show");
				}, function() {
					element.tooltip("hide");
				});
				element.click(function() {
					element.tooltip("hide");
				});
				element.focus(function() {
					element.tooltip("hide");
				});
			}
		}
	};
});

module.directive("clipboardTecTooltip", function(){
	return {
		restrict: "A",
		link: function(scope, element, attributes) {
			element = $(element);
			if (attributes.clipboardTecTooltip) {
				attributes.$observe("clipboardTecTooltip", function() {
					element.tooltip("destroy").attr("title", attributes.clipboardTecTooltip);
				});
			}
			element.attr("data-container", "body");
			element.hover(function() {
				element.tooltip("show");
			}, function() {
				element.tooltip("hide");
			});
			element.click(function() {
				var link = element.attr("copy");
				if ($.isApp() || $.isMobileOrTabletBrowser()) {
					element.tooltip("destroy").attr("title", "Compartilhar");
					element.tooltip("show");
					setTimeout(function() {
						element.tooltip("hide");
					}, 4000);
					if ($.isApp()) {							
						if ($.isAppAndroid()) {
							Android.compartilharLink(link); 
						} else if ($.isAppIOS()) {
							window.webkit.messageHandlers.share.postMessage(link);
						}
					} else if ($.isMobileOrTabletBrowser()) {
						if (navigator.share) {
							navigator.share({
								title: "Compartilhar",
								url: link
							}).catch(console.error);
						} else {
							console.log("browser não suporta compartilhamento mobile.");
						}
					}
				} else {
					// Desktop
					var tempTextArea = document.createElement('textarea');
					tempTextArea.value = link;
					document.body.appendChild(tempTextArea);
					tempTextArea.select();
					document.execCommand("copy");
					document.body.removeChild(tempTextArea);
					element.tooltip("hide");
					element.tooltip("destroy").attr("title", "Copiado!");
					element.tooltip("show");
					setTimeout(function() {
						element.tooltip("destroy").attr("title", "Copiar");
					}, 1000);
				}

			});
			element.focus(function() {
				element.tooltip("hide");
			});
		}
	};
});


module.directive("clipboardTecTooltipSimple", function(){
	return {
		restrict: "A",
		link: function(scope, element, attributes) {
			element = $(element);
			if (attributes.clipboardTecTooltipSimple) {
				attributes.$observe("clipboardTecTooltipSimple", function() {
					element.tooltip("destroy").attr("title", attributes.clipboardTecTooltipSimple);
				});
			}
			element.attr("data-container", "body");
			element.hover(function() {
				element.tooltip("show");
			}, function() {
				element.tooltip("hide");
			});
			element.click(function() {
				var link = element.attr("copy");
					var tempTextArea = document.createElement('textarea');
					tempTextArea.value = link;
					document.body.appendChild(tempTextArea);
					tempTextArea.select();
					document.execCommand("copy");
					document.body.removeChild(tempTextArea);
					element.tooltip("hide");
					element.tooltip("destroy").attr("title", "Copiado!");
					element.tooltip("show");
					setTimeout(function() {
						element.tooltip("destroy").attr("title", "Copiar");
					}, 1000);
			});
			element.focus(function() {
				element.tooltip("hide");
			});
		}
	};
});


module.filter("filtrarHtml", function($sce) {
	return function(html, tipo) {
		var htmlFormatado = $("<div></div>").html(html);
		if (tipo !== 'forum' && $.fn.ajustarRichText) {
			htmlFormatado = htmlFormatado.ajustarRichText();
		} else if (tipo === 'forum' && $.fn.ajustarTextoForum) {
			htmlFormatado = htmlFormatado.ajustarTextoForum();
		}

		return $sce.trustAsHtml(htmlFormatado.html());
	};
});

module.filter("haQuantoTempo", function() {
	return function(data) {
		if (window.moment) {
			return moment(data, "DD/MM/YYYY HH:mm").fromNow();
		}
		return data;
	};
});

module.filter("tirarSinalNegativo", function() {
	return function(num) {
		return Math.abs(num);
	}
});

module.directive("tecFormatarHtml", function($sce) {
	return {
		restrict: "A",
		link: function(scope, elem, attrs, ctrl) {
			scope.$watch(attrs.tecFormatarHtml, function(html) {
				var element = $(elem);
				if (html) {
					element.html(html);
				}
				
				if (element.configLatex) {
					element.configLatex();
				}
				if (element.ajustarRichText) {
					element.ajustarRichText();
				}
			});
		}
	};
});

module.directive("tecAutoFocus", function($timeout) {
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			$timeout(function() {
				$(element).focus();
			}, 0);
		}
	};
});

module.directive("tecShow", function() {
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			var show = scope.$eval(attrs.tecShow);
			$(element).toggle(show);
			
			var speed = "fast";
			scope.$watch(attrs.tecShow, function(value) {
            	if (value) {
            		$(element).slideDown(speed);
            	} else {
            		$(element).slideUp(speed);
            	}
            });
		}
	};
});

module.directive("tecMenuLateral", function(tecMenuLateralFunctions) {
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			var params = scope.$eval(attrs.tecMenuLateral) || {};
			if (params.sentido && params.sentido == 'direita') {
				$(element).addClass("offcanvas-menu-right");				
			} else {
				$(element).addClass("offcanvas-menu");
			}
			
			if (!$(".offcanvas-wrapper").length) {
				var target = params.target || ".body";
				
				var div = $(target);
				div.addClass("offcanvas-wrapper");
				
				if (params.hide) {
					$(params.hide).addClass("offcanvas-hide-on-show");
				}
				
				var divCanvas = $("<div></div>").addClass("offcanvas-canvas");
				div.wrapInner(divCanvas);
				
				var divOverlay = $("<div></div>").addClass("offcanvas-overlay");
				div.find(".offcanvas-canvas").append(divOverlay);
				divOverlay.click(tecMenuLateralFunctions.closeMenu);
				
				$(document).keyup(function(e) {
					if (e.keyCode == 27) {
						var didClose = tecMenuLateralFunctions.closeMenu();
						if (didClose) {
							e.stopImmediatePropagation();
						}
					}
				});
			}
		}
	};
});

module.directive("tecMenuLateralTrigger", function(tecMenuLateralFunctions) {
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			$(element).click(function(e) {
				e.stopPropagation();
				
				var params = scope.$eval(attrs.tecMenuLateralTrigger) || {};
				var target = params.target;
				var scrollbar = params.scrollbar;
				var sentido = 'esquerda';
				if ($(target).hasClass("offcanvas-menu-right")) {
					sentido = 'direita';
				}
				var open = !params.close;

				if (scrollbar == 'visivel') {
					$("body").toggleClass("body-hide-scrollbar");
				} else {
					$(target).toggleClass("hide-scrollbar");
				}

				if (open) {
					if ($.isAppIOS()) {
						// no app IOS o menu lateral não empurra
						// o cabeçalho do site pro lado quando este está fixed, 
						// acaba ficando sobreposto por ele.
						$("#header").removeClass("header-fixed");
				    	var secao = $(".secao:not(#header):not(#rodape)").first();
				    	// pra nao ficar espacamento sem o cabeçalho fixo.
				    	secao.removeClass("secao-fixed");
					}
					
					if (sentido == 'direita') {
						$("body").prepend("<div class='overlay-back-menu-right'></div>");						
						var idTarget = $(target).attr("id");
						// como tem dois elementos com id sub-menu-filtros-salvos no DOM:
						$('[id="'+idTarget+'"]').each(function(i, elementIdTarget) {
						    $(elementIdTarget).addClass("show-menu-right");						    
						})
						$(document).click(function(e) {
							var elementoClick = e.target;
							var contido = $(elementoClick).parents(".offcanvas-menu-right").length;
							if ($(elementoClick).parents(".offcanvas-menu-right").length == 0
									&& $(elementoClick).parents(".ajs-dialog").length == 0
									&& $(elementoClick).parents("#sub-menu-filtros-salvos").length == 0) {
								tecMenuLateralFunctions.closeMenu();
							}
						});
					} else {
						$(".offcanvas-menu").css("z-index", 30);
						$(target).css("z-index", 40);
						
						var canvas = $(".offcanvas-canvas");
						canvas.toggleClass("show-menu");
						
						canvas.find(".voando:visible").each(function() {
							var voando = $(this);
							
							var left = voando.position().left + $(target).outerWidth();
							voando.animate({ left: left }, 200);
						});
					}

				} else {
					tecMenuLateralFunctions.closeMenu();
				}
			});
		}
	};
});

module.factory("tecMenuLateralFunctions", function(tec) {
	var service = {
		closeMenu: closeMenu,
		refreshScroll: refreshScroll
	};
	return service;
	
	function closeMenu() {
		var didClose = false;
		
		$(".show-menu .offcanvas-menu").each(function() {
			var menu = $(this);
			
			$(".offcanvas-canvas .voando:visible").each(function() {
				var voando = $(this);
				var left = voando.position().left - menu.outerWidth();
				voando.animate({ left: left }, 200);
			});
			$(window).resize();
			
			didClose = true;
		});
		
		$(".offcanvas-canvas.show-menu").removeClass("show-menu");
		$(".offcanvas-canvas.hide-scrollbar").removeClass("hide-scrollbar");
		$(".offcanvas-menu-right").removeClass("show-menu-right");
		$(".overlay-back-menu-right").remove();
		$(".body-hide-scrollbar").removeClass("body-hide-scrollbar");

		return didClose;
	}
	
	function refreshScroll() {
		$(window).scroll().resize();
	}
});

module.directive("tecLockScroll", function() {
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			$(element).bind("mousewheel DOMMouseScroll", function (e) {
				var borders = parseInt($(this).css("border-top-width")) + parseInt($(this).css("border-bottom-width"));
				if ($(this)[0].scrollHeight + borders !== $(this).outerHeight()) {
					var e0 = e.originalEvent;
					var delta = e0.wheelDelta || -e0.detail;
					
					this.scrollTop += ( delta < 0 ? 1 : -1 ) * 30;
					e.preventDefault();
				}
			});
		}
	};
});

module.directive("tecMarkdown", function() {
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			if (!$.fn.markItUp) {
				throw "MarkItUp not found";
			}
			
			var setting = attrs.tecMarkdown || "tec";
			
			var activeSetting = {
				"tec": tecSettingsMarkItUp,
				"favoritas": tecSettingsFavoritasMarkItUp
			}[setting];
			
			$(element).markItUp(activeSetting);
		}
	};
});

module.directive("tecCkeditor", function() {
	return {
		restrict: "A",
		require: '?ngModel',
		link: function(scope, element, attrs, ngModel) {
			var editorOptions;
            if (attrs.tecCkeditor === 'minimal') {
                // minimal editor
                editorOptions = {
                    height: 180,
                    toolbar: [
            			{ name: 'clipboard', items: [ 'Undo', 'Redo' ] },
            			{ name: 'basicstyles', items: [ 'Bold', 'Italic', 'Underline', 'Strike', '-', 'RemoveFormat' ] },
            			{ name: 'colors', items: [ 'TextColor', 'BGColor' ] },            			
            			{ name: 'paragraph', items: [ 'NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock' ] },
            			{ name: 'insert', items: [ 'EmbedSemantic', 'Table' ] },
            			{ name: 'tools', items: [ 'Maximize' ] },
                    ],
                    extraPlugins: 'wordcount,notification,justify',
                    wordcount: {
                    	showWordCount: false,
                    	showParagraphs: false,
			            showCharCount: true,
			            countBytesAsChars: true,
		                countSpacesAsChars: true,
		                countHTML: true,
		                countLineBreaks: true,			            
			            maxCharCount: 4000
			        },
                    removePlugins: 'elementspath',
                    resize_enabled: true,
                    fillEmptyBlocks: false,
                    enterMode: CKEDITOR.ENTER_P
                };
            };
			
			var ck = CKEDITOR.replace(element[0], editorOptions);
			if (!ngModel) return;
			ck.on('instanceReady', function () {
				ck.setData(ngModel.$viewValue);
			});
			function updateModel() {
				scope.$apply(function () {
					ngModel.$setViewValue(ck.getData());
				});
			}
			ck.on('change', updateModel);
			ck.on('key', updateModel);
			ck.on('dataReady', updateModel);
			
			ngModel.$render = function (value) {
				ck.setData(ngModel.$viewValue);
			};
			
			scope.$on("$destroy",function() {
                ck.destroy();
            });
		}
	};
});

module.directive("tecJodit", function($compile) {
	return {
		restrict: "A",
		require: '?ngModel',
		link: function(scope, element, attrs, ngModel) {
			var parametrosExtras = scope.$eval(attrs.parametrosExtras);

			var editorOptions;
            if (attrs.tecJodit === 'minimal') {
                // minimal editor
                editorOptions = {
                    height: 250,
                    limitChars: 4000,
                    limitHTML: true,
                    askBeforePasteHTML: false,
                    askBeforePasteFromWord: false,
                    language: "pt_br",
                    buttonsXS: "undo,redo,|,bold,italic,underline,strikethrough,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,table,|,hr,|,selectall,fullsize",
                    buttonsSM: "undo,redo,|,bold,italic,underline,strikethrough,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,table,|,hr,|,selectall,fullsize",
                    buttonsMD: "undo,redo,|,bold,italic,underline,strikethrough,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,table,|,hr,|,selectall,fullsize",
                    buttons:   "undo,redo,|,bold,italic,underline,strikethrough,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,table,|,hr,|,selectall,fullsize",
                    removeEmptyBlocks: true,
                    cleanWhitespace: true,
                    useNativeTooltip: true,
                    enter: "p",
                    defaultActionOnPaste: 'insert_clear_html',
                    disablePlugins: "iframe, image, link",
                };
            };
            if (attrs.tecJodit === 'uploadImageForum') {
            	uploadUrl = $.getUrl('/api/discussoes/image-upload');
                editorOptions = {
                	autofocus: true,
                    height: 250,
                    limitChars: 4000,
                    limitHTML: false, // Se true ele conta o HTML dentro do limite de caractéres então pode ser que o usuário não consiga colar algum texto pequeno por que tem muito HTML
                    askBeforePasteHTML: false,
                    askBeforePasteFromWord: false,
                    language: "pt_br",
                    buttonsXS: "undo,redo,|,bold,italic,underline,strikethrough,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,image,|,table,|,hr,|,selectall,fullsize",
                    buttonsSM: "undo,redo,|,bold,italic,underline,strikethrough,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,image,|,table,|,hr,|,selectall,fullsize",
                    buttonsMD: "undo,redo,|,bold,italic,underline,strikethrough,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,image,|,table,|,hr,|,selectall,fullsize",
                    buttons:   "undo,redo,|,bold,italic,underline,strikethrough,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,image,|,table,|,hr,|,selectall,fullsize",
                    removeEmptyBlocks: true,
                    cleanWhitespace: true,
                    useNativeTooltip: true,
                    enter: "p",
                    defaultActionOnPaste: 'insert_as_html',
                    cleanHTML: {
                    	cleanOnPaste: false,
                    },
                    disablePlugins: "iframe, link, imageProperties",
                    imageDefaultWidth: 400,
                    enableDragAndDropFileToEditor: false,
                    uploader: {
                    	url: uploadUrl,
                    	insertImageAsBase64URI: false,
                    	filesVariableName: 'images',
                        prepareData: function (data) {
                    		$.exibirAjaxLoading();

                    		if (!!parametrosExtras.prefixoImagem) {
								data.append("prefixoNome", parametrosExtras.prefixoImagem);
							}

                            return data;
                        },
                    	isSuccess: function (resp) {
                    		$.ocultarAjaxLoading();
                    		if (resp.data.error && resp.data.error != '') {
                    			$.alerts.alert(resp.data.error, "Erro")
                    		}
                    		return !resp.data.error;
                    	},
                    	process: function (resp) {
                    		$.ocultarAjaxLoading();
                            return {
                                files: resp.data.images || [],
                                path: resp.data.path,
                                baseurl: resp.data.baseurl,
                                error: resp.data.error,
                                msg: resp.data.messages
                            };
                        },
                        error: function (e) {
                        	$.ocultarAjaxLoading();
                        	$.alerts.alert('Houve um erro no carregamento da imagem', "Erro")
                        },
                    },
                	image: {
                		openOnDblClick: false,
                		editSrc: false,
                		useImageEditor: false,
                		editTitle: false,
                		editAlt: false,
                		editLink: false,
                		editSize: false,
                		editBorderRadius: false,
                		editMargins: false,
                		editClass: false,
                		editStyle: false,
                		editId: false,
                		editAlign: true,
                		showPreview: false,
                		selectImageAfterClose: true
                	},
				   	popup: {
				    	img: Jodit.Array(Jodit.defaultOptions.popup.img.filter(function(b) { return b.name !== 'pencil'; }))
				    }
                };
            };
            if (attrs.tecJodit === 'uploadImageFavoritas') {
            	uploadUrl = $.getUrl('/api/favoritas/image-upload');
                editorOptions = {
                	autofocus: true,
                    height: 250,
                    limitChars: 4000,
                    limitHTML: false, // Se true ele conta o HTML dentro do limite de caractéres então pode ser que o usuário não consiga colar algum texto pequeno por que tem muito HTML
                    askBeforePasteHTML: false,
                    askBeforePasteFromWord: false,
                    language: "pt_br",
                    buttonsXS: "undo,redo,|,bold,italic,underline,strikethrough,copyformat,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,image,|,table,|,hr,|,selectall,fullsize",
                    buttonsSM: "undo,redo,|,bold,italic,underline,strikethrough,copyformat,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,image,|,table,|,hr,|,selectall,fullsize",
                    buttonsMD: "undo,redo,|,bold,italic,underline,strikethrough,copyformat,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,image,|,table,|,hr,|,selectall,fullsize",
                    buttons:   "undo,redo,|,bold,italic,underline,strikethrough,copyformat,|,eraser,|,align,|,brush,|,ul,ol,|,outdent,indent,|,image,|,table,|,hr,|,selectall,fullsize",
                    removeEmptyBlocks: true,
                    cleanWhitespace: true,
                    useNativeTooltip: true,
                    enter: "p",
                    defaultActionOnPaste: 'insert_as_html',
                    disablePlugins: "iframe, link, imageProperties",
                    imageDefaultWidth: 400,
                    enableDragAndDropFileToEditor: false,
                    uploader: {
                    	url: uploadUrl,
                    	insertImageAsBase64URI: false,
                    	filesVariableName: 'images',
                    	prepareData: function (data) {
                    		$.exibirAjaxLoading();

                    		if (!!parametrosExtras.prefixoImagem) {
								data.append("prefixoNome", parametrosExtras.prefixoImagem);
							}

                    		return data;
                    	},
                    	isSuccess: function (resp) {
                    		$.ocultarAjaxLoading();
                    		if (resp.data.error && resp.data.error != '') {
                    			$.alerts.alert(resp.data.error, "Erro")
                    		}
                    		return !resp.data.error;
                    	},
                    	process: function (resp) {
                    		$.ocultarAjaxLoading();
                            return {
                                files: resp.data.images || [],
                                path: resp.data.path,
                                baseurl: resp.data.baseurl,
                                error: resp.data.error,
                                msg: resp.data.messages
                            };
                        },
                        error: function (e) {
                        	$.ocultarAjaxLoading();
                        	$.alerts.alert('Houve um erro no carregamento da imagem', "Erro")
                        },
                    },
                    image: {
                    	openOnDblClick: false,
                    	editSrc: false,
                    	useImageEditor: false,
                    	editTitle: false,
                    	editAlt: false,
                    	editLink: false,
                    	editSize: false,
                    	editBorderRadius: false,
                    	editMargins: false,
                    	editClass: false,
                    	editStyle: false,
                    	editId: false,
                    	editAlign: true,
                    	showPreview: false,
                    	selectImageAfterClose: true
                    },
				   	popup: {
				    	img: Jodit.Array(Jodit.defaultOptions.popup.img.filter(function(b) { return b.name !== 'pencil'; }))
				    }
                };
            };
            if (attrs.tecJodit === 'sticky') {
            	// minimal editor
            	editorOptions = {
            			limitChars: 4000,
            			limitHTML: true,
            			askBeforePasteHTML: false,
            			askBeforePasteFromWord: false,
            			defaultActionOnPaste: 'insert_clear_html',
            			language: "pt_br",
            			buttonsXS: "bold,italic,underline,strikethrough,|,eraser,|,ul,ol,|,outdent,indent,|,hr,|,selectall",
            			buttonsSM: "bold,italic,underline,strikethrough,|,eraser,|,ul,ol,|,outdent,indent,|,hr,|,selectall",
            			buttonsMD: "bold,italic,underline,strikethrough,|,eraser,|,ul,ol,|,outdent,indent,|,hr,|,selectall",
            			buttons:   "bold,italic,underline,strikethrough,|,eraser,|,ul,ol,|,outdent,indent,|,hr,|,selectall",
            			removeEmptyBlocks: true,
            			cleanWhitespace: true,
            			useNativeTooltip: true,
            			enter: "p",
            			defaultActionOnPaste: 'insert_clear_html',
            			disablePlugins: "iframe, image, link",
            	};
            };
           	if (attrs.tecJodit === 'configuracaoMensagem') {
				// minimal editor
				editorOptions = {
					minHeight: 49,
					height: 49,
					limitChars: 400,
					limitHTML: true,
					askBeforePasteHTML: false,
					askBeforePasteFromWord: false,
					language: "pt_br",
					buttonsXS: "undo,redo,|,bold,italic,|,brush",
					buttonsSM: "undo,redo,|,bold,italic,|,brush",
					buttonsMD: "undo,redo,|,bold,italic,|,brush",
					buttons:   "undo,redo,|,bold,italic,|,brush",
					removeEmptyBlocks: true,
					cleanWhitespace: true,
					useNativeTooltip: true,
					enter: "br",
					defaultActionOnPaste: 'insert_clear_html',
					disablePlugins: "iframe, image, link",
				};
			}
           	
           	if (attrs.tecJodit === 'uploadImageForum' || attrs.tecJodit === 'uploadImageFavoritas') {
           		
           		// plugin para o upload direto de imagens no editor, por drag and drop ou copiar e colar.
    			Jodit.plugins.colarImagem = function(editor) {
    				
					var enviarImagemBase64 = function(base64, nome, tipo, editor, batch, batchSize, idRandomico) {
               			var request = new XMLHttpRequest();
    					var formData = new FormData();

    					request.open("POST", contextPathUrl + "api/discussoes/image-upload-base64", true);
    					request.onreadystatechange = function() {
    							if (request.readyState === 4) {
    								if (!batch.contador) {
    									batch.contador = 1;
    								} else {
    									batch.contador++;
    								}
    								if (batch.contador == batchSize) {    									
    									$.ocultarAjaxLoading();
    								}
    								if (request.status === 200) {
    									var response = request.response;
    									var pathUrl = JSON.parse(response).path;

    									// insere src da imagem s3 no placeholder
										var elementImgPlaceholder = document.getElementById(idRandomico);
    									elementImgPlaceholder.src = pathUrl;

    									// deleta img base64 temporária do editor
    									// pra não dar bug
										$(editor.editor).find("img[src*='base64']").remove();
										$(editor.editor).find("img:not([src*='tecconcursos'])").remove();

										// força o update do ng-model
										editor.setEditorValue(editor.value);
    								} else if (request.status >= 400 && request.status <= 599) {
    									$.alerts.alert("Erro ao enviar imagem " + nome);
    									$("img[src*='base64']").remove();
										var imgPlaceholder = $("img#" + idRandomico);
    									imgPlaceholder.remove();
    								}
    							}
    					}

    					formData.append("imagemBase64", base64);
    					formData.append("imagemNome", nome);
    					formData.append("imagemTipo", tipo);

    					if (!!parametrosExtras.prefixoImagem) {
							formData.append("prefixoNome", parametrosExtras.prefixoImagem);
						}

    					$.exibirAjaxLoading();
    					request.send(formData);
               		}
               		
               		var lerEEnviarImageFile = function(i, files, batch, editor) {
               			if (!files) {
               				return;
               			}
           				var file = files[i];
           				if (file && file.type && file.type.includes("image")) {
           					var fileType = file.type;
           					if (fileType == "image/png" || fileType == "image/jpg" || fileType == "image/jpeg") {
           						// inserindo img de placeholder no editor
								var idRandomico = "inserir-" + (Math.random() + 1).toString(36).substring(7);
								editor.selection.insertHTML("<img id='" + idRandomico + "' style='width: 400px' />");
                       			var fileReader = new FileReader();
                       			fileReader.readAsDataURL(file);
                       			fileReader.onloadend = function() {
                       				var base64 = fileReader.result;
									enviarImagemBase64(base64, file.name, file.type, editor, batch, files.length, idRandomico);
                       				
                       				if (i + 1 < files.length) {
                       					lerEEnviarImageFile(++i, files, batch, editor);
                       				}
                       			}
           					}
           				}
               		}
               		
    			    editor.events.on("drop", function(event) {
    			    	// drag and drop de imagens do computador para o editor
						var dataTransfer = event.dataTransfer;
						if (dataTransfer) {
	    			    	var files = dataTransfer.files;
	    			    	if (files && files.length > 2) {
	    			    		$.alerts.alert("A quantidade de imagens que podem ser inseridas por vez está limitada a 2.");
	    			    	} else {
	    			    		// para controlar o spinner
	    			    		var batch = {};
	    			    		lerEEnviarImageFile(0, files, batch, editor);
	    			    	}							
						}
    			    });
    			    
    			    editor.events.on("paste", function(e) {
						var clipboarData = e.clipboardData || window.clipboardData;
						var targetElement = e.srcElement.innerHTML;
						if (targetElement.includes("&lt;�img")) {
							// conserta drop de img quebrada
							e.srcElement.innerHTML = "";
						}
						
						if (clipboarData) {
							var file = clipboarData.files[0];
    			    	
	    			    	if (file) {
	    			    		// copiar e colar de imagem de outra aba/página web para o editor
								if (attrs.tecJodit === 'uploadImageForum' 
									|| (attrs.tecJodit === 'uploadImageFavoritas' && !targetElement.includes("<img src"))) {
					    			lerEEnviarImageFile(0, [file], {}, editor);
								} else {
									// como o editor de favoritas permite HTML não precisa fazer o upload pro S3.
								}
	    			    	} else {
	    			    		// ctrl+c ctrl+v de imagens salvas do computador do usuário para o editor
	    			    		// não está funcionando nesta versão do Jodit, não gera
	    			    		// o arquivo base64 temporário no editor...
	    			    	}
						}    			    	
    			    });

    			}
    			
    			// evita drag&drop de abrir nova aba no Chrome
    			window.addEventListener("dragover",function(e){
    				  e = e || event;
    				  e.preventDefault();
    				},false);
				window.addEventListener("drop",function(e){
				  e = e || event;
				  e.preventDefault();
				},false);

				Jodit.plugins.workarroundPaste = function (editor) {
					/*
						Na versão que estamo do Jodit (3.2.44), quando um HTML é colado de fora do editor, é disparado
						o evento 'processPaste' [1]. Há um único lugar no código deles que trata o evento [2], e ele
						sempre faz o processo de limpar o HTML, que vai deixar apenas as tags, sem qualquer atributo.
						Então para que o 'insert_as_html' funcione e a formatação seja preservada, é preciso impedir
						que este processo seja feito neste momento.

						Isso é feito com a seguinte configuração:

						cleanHTML: {
							cleanOnPaste: false
						}

						Porém, caso não tenha nenhum "handler" para esse evento, ele vai retornar undefined, e o texto
						colado vai ser perdido. Devido a isso, temos que declarar esse handler aqui, para que seja
						tratado somente de acordo com o configurado na opção 'defaultActionOnPaste'.

						Aproveitamos isso para fazer uma limpeza inicial do HTML para que caso tenha alguma injeção de
						código, a mesma não rode para o usuário que está colando o texto.

						[1] https://github.com/xdan/jodit/blob/3.2.44/src/plugins/paste.ts#L273
						[2] https://github.com/xdan/jodit/blob/3.2.44/src/plugins/clean-html.ts#L107
					*/
					editor.events.on('processPaste', function (event, html) {
						// É criado um novo DOMParser para que o HTML colado não entre na árvore do DOM atual, que faria
						// com que qualquer injeção de código rodasse.
						var dom = (new DOMParser()).parseFromString(html , 'text/html');
						var htmlTratado = $(dom).limparHtmlColado();

						return htmlTratado;
					});
				}
           	}
           	
			var jt = new Jodit(element[0], editorOptions);

			if (attrs.tecJodit === 'uploadImageForum' || attrs.tecJodit === 'uploadImageFavoritas') {
				$(jt.editor).attr("tec-exibicao-texto", "");
			}

			$compile(jt.editor)(scope)

			if (!ngModel) return;

			ngModel.$render = function(value) {
				jt.setEditorValue(ngModel.$viewValue);
				if ($.isApp()) {
					var mut = new MutationObserver(function(mutations, mut){
					    var joditFullSize = $(".jodit_fullsize").first();
						if (joditFullSize.length) {
							joditFullSize.addClass('jodit-fullsize-fixed');
						}
					});
					mut.observe(jt.container,{
						'attributes': true
					});	
					jt.mut = mut;
				}
			};

			scope.$on("$destroy",function() {
				if ($.isApp()) {
					jt.mut.disconnect();
				}
				jt.destruct();
			});
		}
	};
});

module.directive("tecQuill", function() {
	return {
		restrict: "A",
		require: '?ngModel',
		link: function(scope, element, attrs, ngModel) {
			var editorOptions;
            if (attrs.tecQuill === 'minimal') {
                // minimal editor
                editorOptions = {
                    height: 250,
                    debug: 'info',
                    placeholder: 'Escreva aqui seu comentário',
                    theme: 'snow'
                };
            };
			
            console.log(element[0]);
            
            var quill = new Quill(element[0], editorOptions);

			if (!ngModel) return;

			ngModel.$render = function(value) {
				quill.setText(ngModel.$viewValue);
			};
			
			scope.$on("$destroy",function() {
				quill.destruct();
            });
		}
	};
});

module.directive("tecDisableSelection", function() {
	return {
		restrict: "A",
		link: function(scope, element, attrs) {
			function cancelEvent(e) {
				e.preventDefault();
			}
			
			var e = "onselectstart" in document.createElement("div") ? "selectstart" : "mousedown";
			$(element).bind(e, cancelEvent).bind("contextmenu", cancelEvent);
		}
	};
});

module.directive("tecClickWhenKey", function($window, $document, $rootScope, tec) {
	return {
		restrict: "A",
		scope: {
			tecClickWhenKey: "@",
			tecEnableEnterWhenFocus: "=",
			tecRequireCtrl: "@"
		},
		link: function(scope, element, attrs) {
			if (!tec.tecClickWhenKeyInicializado) {
				tec.tecClickWhenKeyInicializado = true;
				$document.bind("keyup", function(e) {
					$rootScope.$broadcast("tecKeypress", e);
				});
			}

			element.on("keydown", function (e) {
				//impedir que botao com foco clique quando pressionado Enter.
				if(e.keyCode == 13 && !attrs.tecEnableEnterWhenFocus) {
					e.preventDefault();
		        }
			});
			

			var requireCtrl = attrs.tecRequireCtrl === "true";

			var off = $rootScope.$on("tecKeypress", function(_, e) {
				//Desabilitar atalho quando existe texto selecionado.
				/*if (window.getSelection().toString() != "") {
					return;
				}*/
				
				var keys = attrs.tecClickWhenKey;
				var keySplitArr = keys.split(",");
				var key1 = keySplitArr[0];
				if (key1) { 
					key1 = key1.trim();
				}
				var key2 = keySplitArr[1];
				if (key2) { 
					key2 = key2.trim();
				}
				var key3 = keySplitArr[2];
				if (key3) { 
					key3 = key3.trim();
				}


				//impedir atalho quando estiver digitando em textarea
				var activeElement = e.currentTarget.activeElement;
				var inputText = (activeElement.tagName == "INPUT" && activeElement.type == "text");
				var usingCtrl = requireCtrl ? e.ctrlKey : !e.ctrlKey;
				var modifierKey = e.shiftKey || e.metaKey || e.altKey;
				if (usingCtrl && !modifierKey && activeElement.tagName != 'TEXTAREA' && !inputText && activeElement.contentEditable != 'true' && (key1 == e.keyCode || key2 == e.keyCode || key3 == e.keyCode) && ((element.is(":visible") && !element.is(":disabled")) || element.attr("name") == "questao")) {
					element.trigger("click");
					
					// TEC-1407
					// please note, 
					// that IE11 now returns undefined again for window.chrome
					// and new Opera 30 outputs true for window.chrome
					// and new IE Edge outputs to true now for window.chrome
					// and if not iOS Chrome check
					// so use the below updated condition
					var isChromium = window.chrome,
					    winNav = window.navigator,
					    vendorName = winNav.vendor,
					    isOpera = winNav.userAgent.indexOf("OPR") > -1,
					    isIEedge = winNav.userAgent.indexOf("Edge") > -1,
					    isIOSChrome = winNav.userAgent.match("CriOS"),
					    isMSIE = (winNav.userAgent.indexOf('MSIE')!== -1 || winNav.appVersion.indexOf('Trident/') > 0);

					if(isIOSChrome){
					   // is Google Chrome on IOS
						element.focus();
					} else if(isChromium !== null && isChromium !== undefined && vendorName === "Google Inc." && isOpera == false && isIEedge == false) {
					   // is Google Chrome
						element.focus();
					}
				}
		    });
			
			element.on("$destroy", function() {
				off();
			});
		}
	};
});

module.directive("tecBarreiraEventos", function () {
	return {
		restrict: "A",
		scope: {
			tecBarreiraEventos: "@"
		},
		link: function(scope, element, attrs) {
			var evento = attrs.tecBarreiraEventos || "click";
			$(element).bind(evento, function(e) {
				e.preventDefault();
				e.stopPropagation();
			});
		}
	}
});

module.directive("tecDetectarOverflow", function($window) {
	return {
		restrict: "A",
		scope: {
			tecDetectarOverflow: "&"
		},
		link: function(scope, elem, attributes) {
			var element = elem[0];
			
			scope.$watch(function() {
				return element.scrollHeight;
			}, function(newValue, oldValue) {
				if (newValue != oldValue) {
					var overflow = element.offsetHeight < element.scrollHeight;
					scope.tecDetectarOverflow({ overflow: overflow });
				}
			});
			
			angular.element($window).bind("resize", function() {
				scope.$apply();
			});
		}
	};
});

module.directive("tecUsarCorImagemComoBackground", function() {
	return {
		restrict: "A",
		link: function(scope, elem, attributes) {
			try {
				var config = scope.$eval(attributes.tecUsarCorImagemComoBackground);
				
				var element = $(elem[0]);
				var img = element.find("img");
				img.load(function() {
					var color = encontrarCor(img[0]);
					if (color) {
						element.css("background-color", "rgb(" + color.join(",") + ")");
					}
				}).onerror=function(){
					console.log('ERRO NO CARREGAMENTO DA IMAGEM')
				};
				
				function encontrarCor(image) {
					var colorThief = new ColorThief();
					var cor = colorThief.getColor(image);
					if (config.evitarCorElemento) {
						var evitar = $(config.evitarCorElemento).css("background-color").replace(/[^,\d]/g, "").split(",");
						var paleta = [cor].concat(colorThief.getPalette(image));
						$.each(paleta, function(_, elemento) {
							if (distanciaCores(elemento, evitar) > 80.0) {
								cor = elemento;
								return false;
							}
						});
					}
					return cor;
				}
				
				function distanciaCores(cor, cor2) {
					var soma = 0.0;
					for (var i = 0; i <= 2; i++) {
						soma += Math.pow(parseFloat(cor[i]) - parseFloat(cor2[i]), 2);
					}
					return Math.sqrt(soma);
				}
			} catch (e) {
				console.log(e);
			}
		}
	};
});

module.directive("tecExibicaoTexto", function () {

	function alterarTamanhoTexto(element, data) {
		var fontSize = element.css("font-size");

		var temPx = fontSize.indexOf("px") !== -1;

		var alteracao = temPx ? data.quantidade * 16 : data.quantidade;

		var valorNovo = parseFloat(fontSize) + alteracao;
		
		// TODO: melhorar isso
		// fazer uma diretiva só pra atualizar elementos proporcionais ao tamanho da fonte
		if (element[0].classList.contains('questao-enunciado-alternativa-opcao')) {
			var width = element.css("width");
			var temPx = fontSize.indexOf("px") !== -1;
			var alteracao = temPx ? data.quantidade * 16 : data.quantidade;
			var valorNovoWidth = parseFloat(width) + alteracao;
			
			var height = element.css("height");
			var temPx = fontSize.indexOf("px") !== -1;
			var alteracao = temPx ? data.quantidade * 16 : data.quantidade;
			var valorNovoHeight = parseFloat(height) + alteracao;

			element.css("width", valorNovoWidth + ( temPx ? "px" : "rem" ) );
			element.css("height", valorNovoHeight + ( temPx ? "px" : "rem" ) );
			
			var alternativaTexto = element.closest(".questao-enunciado-alternativa").find(".questao-enunciado-alternativa-texto");
			var paddingLeftTexto = alternativaTexto.css("padding-left");
			var temPx = paddingLeftTexto.indexOf("px") !== -1;
			var alteracao = temPx ? data.quantidade * 16 : data.quantidade;
			var valorNovoPaddingLeft = parseFloat(paddingLeftTexto) + alteracao;
			alternativaTexto.css("padding-left", valorNovoPaddingLeft + ( temPx ? "px" : "rem" ) )
		}

		element.css("font-size", valorNovo + ( temPx ? "px" : "rem" ) );
    }

    function alterarEspacamento(element, data) {
    	element.removeClass("espacamento-1");
    	element.removeClass("espacamento-2");
    	element.removeClass("espacamento-3");
    	element.removeClass("espacamento-4");
    	
    	if (data.espacamento) {
    		element.addClass("espacamento-" + data.espacamento);
    	} else {
    		element.addClass("espacamento-3");//default caso nao encontre
    		
    	}
    }

	function link(scope, element, attrs) {
		var attributes = attrs.tecExibicaoTexto ? attrs.tecExibicaoTexto.split(",") : [];

		if (attributes && (attributes.length == 0 || (attributes.includes && attributes.includes("fonte")))) {
			$.Topic("tamanho-fonte-alterado").subscribe(function(data) {
				alterarTamanhoTexto(element, data);
			});

			$.obterValorConfiguracaoUsuario("tamanhoFonte").then(function(tamanhoFonteAtual) {
				alterarTamanhoTexto(element, { quantidade: tamanhoFonteAtual });
			})
			.catch(function(){});
		}

		if (attributes.length == 0 || (attributes.includes && attributes.includes("espacamento"))) {
			$.Topic("espacamento-alterado").subscribe(function(data) {
            	alterarEspacamento(element, data);
            });

			$.obterValorConfiguracaoUsuario("espacamento").then(function(espacamentoAtual) {
				alterarEspacamento(element, { espacamento: espacamentoAtual });
			})
			.catch(function(){});
		}

	}

	return {
		restrict: 'A',
		link: link,
	};
})

//Setup the filter
module.filter('tempo', function() {
	return function(segundos) {
		if(isNaN(segundos) || segundos <= 0) {
			return "00:00";
		} else {
			// If the data we are applying the filter to is a number, perform the actions to check it's ordinal suffix and apply it.
			var date = new Date(null);
			date.setSeconds(segundos);
			return date.toISOString().substr(11, 5);
		}
	}
});



})();
