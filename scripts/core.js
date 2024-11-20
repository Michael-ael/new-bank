(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  /*global jQuery, */
  (function ($) {

    var W = window;
    var C = W.console;
    var $W = $(W);

    $.debounce = function (fn, ms) {
      var token;
      return function () {
        W.clearTimeout(token);
        token = W.setTimeout(fn, ms || 999);
      };
    };

    $.delay = function $delay(fn, ms) {
      W.setTimeout(fn, ms || 33);
    }; // - - - - - - - - - - - - - - - - - -
    // ARTIFICIAL EVENTS


    $W.on('resize', $.debounce(function () {
      $.publish('resizeend');
    }, 99));
    $W.on('scroll', $.debounce(function () {
      $.publish('scrollend');
    }, 33));
    $W.on('keyup', function (evt) {
      if (evt.keyCode === 27) {
        $.publish('escapekey');
      }
    }); // - - - - - - - - - - - - - - - - - -
    // AUTOMATE

    $.reify = function (obj) {
      // replace vals(selectors) with elements
      return $.each(obj, function (i, sel) {
        if (typeof sel === 'object') {
          sel = sel.selector;
        }

        (obj[i] = $(sel)).selector = sel;
      });
    }; // - - - - - - - - - - - - - - - - - -
    // PUBSUBS


    var QUE = $.pubsubs = $({});

    $.publish = function () {
      QUE.trigger.apply(QUE, arguments);
    };

    $.subscribe = function () {
      QUE.on.apply(QUE, arguments);
    };

    $.unsubscribe = function () {
      QUE.off.apply(QUE, arguments);
    }; // - - - - - - - - - - - - - - - - - -
    // WATCHERS


    $.watchResize = function (fn, ns) {
      ns = 'resize.' + (ns || 'Util');
      $W.off(ns);

      if (fn) {
        fn();
        $W.on(ns, fn);
      }
    }; // Callback with vscroll pos (current, previous)


    $.watchScroll = function (cb, ms) {
      var body = $(document);
      var slug = 'jq-xtn:watchScroll';
      var last = body.scrollTop();

      cb = cb || function (a, z) {
        C.log(slug, a, '<<<', z);
      };

      body.on('scroll', $.debounce(function () {
        var next = body.scrollTop();

        try {
          cb(next, last);
        } catch (err) {
          C.error(slug, err, cb);
        }

        last = next;
      }, ms || 33));
    }; // - - - - - - - - - - - - - - - - - -
    // CLASSIFIERS
    // Auto-add location hash as a class to doc


    $.classHash = function (cb) {
      cb = cb || $.noop; // do not invoke

      function trackHash() {
        var self = trackHash;
        var hash = W.location.hash.slice(1);
        var prev = self.previous;

        if (prev !== hash) {
          $('html').removeClass(prev).addClass(hash);
          self.previous = hash;
        }

        try {
          cb(hash, prev);
        } catch (err) {
          C.error(err);
        }

        return self;
      }

      $W.on('hashchange', trackHash());
    }; // Classify if using keyboard or mouse


    $.classDevice = function () {
      var body = $('body');
      body.on('keydown', $.debounce(function () {
        body.removeClass('mouse').addClass('keyboard');
      }, 333)).on('mouseover', function () {
        // `mousemove` has side effects on windows browsers
        body.removeClass('keyboard').addClass('mouse');
      });
    }; // Classify page with user agent


    $.classAgent = function () {
      var ua = W.navigator.userAgent;
      var $h = $('html');
      $.watchResize(function () {
        if (ua.match(/mobi/i) || $W.width() < 768) {
          // simulate
          $h.addClass('mobi');
        } else {
          $h.removeClass('mobi');
        }

        if (ua.match(/chrome/i)) {
          $h.addClass('chrome');
        } else if (ua.match(/safari/i)) {
          $h.addClass('safari');
        } else if (ua.match(/firefox/i)) {
          $h.addClass('firefox');
        } else if (ua.match(/trident/i)) {
          $h.addClass('trident');
        }
      }, 'markAgent');
    }; // - - - - - - - - - - - - - - - - - -
    // ETC
    // Check event for clarity


    $.isAffirmative = function (evt, trig) {
      trig = trig || 'click keyup'; // keypress 'return' will not fire on msie

      if (evt.type.slice(0, 3) === 'key') {
        return evt.which === 13; // no evt.key for safari < 10.1
      } else if (trig.indexOf(evt.type > -1)) {
        return true; // click probably
      }
    };

    $.fn.inlineSvg = function (cb) {
      var $img = $(this);
      var $svg, size;
      size = {
        // force msie to respect size
        height: $img.css('height'),
        width: $img.css('width')
      };
      $.get($img.attr('src'), 'xml').done(function (data) {
        $svg = $(data).find('svg').attr({
          id: $img.attr('id'),
          alt: $img.attr('alt'),
          class: $img.attr('class'),
          style: ($img.attr('style') || '').replace('color', 'fill'),
          focusable: $img.attr('focusable'),
          // for msie 11
          'xmlns:a': null // for validator.w3.org

        }); // svg scales if the viewport is set

        if (!$svg.attr('viewBox') && $svg.attr('height') && $svg.attr('width')) {
          $svg.attr('viewBox', '0 0 ' + $svg.attr('height') + ' ' + $svg.attr('width'));
        }

        if ($img.attr('height') || $img.attr('width')) {
          $svg.css(size);
        } // hide but keep original image


        $img.hide().wrap('<span class="replaced-svg">');
        $svg.insertBefore($img).css('visibility', 'visible');
      }).fail(C.warn).always(cb);
    };

    $.inlineSvgs = function (cb) {
      var limit = $.debounce(cb, 321); // try cb until the last one loads

      $('img.svg').each(function () {
        $(this).inlineSvg(limit);
      }).removeClass('svg'); // make sure they do not get matched again
    };

    return $;
  })(jQuery);

  /*global jQuery, */
  jQuery(function ($) {

    const W = window;
    const D = W.document;
    const BS = D.body.style;
    const $body = $('body');

    function iOS() {
      var ithings = ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'];
      var ithing = ithings.includes(navigator.platform); // iPad on iOS 13 detection
      // https://stackoverflow.com/questions/9038625/detect-if-device-is-ios

      ithing = ithing || navigator.userAgent.includes('Mac') && 'ontouchend' in document;
      return ithing;
    }

    var force = iOS(); // use force on iDevices

    var offsetTop = 0;
    var originalStyles = BS.cssText;
    var scrollContainer = D.scrollingElement || D.documentElement; // required for iOS
    // swiped from https://github.com/BKWLD/body-scroll-toggle

    var API = {
      freeze: function () {
        offsetTop = scrollContainer.scrollTop;
        originalStyles = BS.cssText;

        if (force) {
          $body.css({
            height: '100%',
            overflow: 'hidden',
            position: 'fixed',
            top: -offsetTop + 'px',
            width: '100%'
          });
        } else {
          $body.css('overflow', 'hidden');
        }
      },
      unfreeze: function (anchor, offset) {
        anchor = $(anchor);

        if (force) {
          BS.cssText = originalStyles;
        } else {
          $body.css('overflow', 'visible');
        }

        if (anchor.length) {
          offsetTop = anchor.offset().top - (offset || 0);
        }

        scrollContainer.scrollTop = offsetTop;
      },
      toggle: function () {
        if (!offsetTop) {
          this.unfreeze();
        } else {
          this.freeze();
        }
      }
    }; // Map for compatibility

    API.disable = API.freeze;
    API.enable = API.unfreeze; // Expose

    W.bodyScroll = API;
  });

  /*global jQuery, */
  jQuery(function ($) {

    const W = window;
    var EL = {
      // list of items we want to use
      list: '<ul class="mobile">',
      footer: 'footer:last',
      // footer might show up twice
      global: '.navlinks-global',
      primary: '.navlinks-primary',
      secondary: '.navlinks-secondary',
      wrap: '#MobileMenu'
    }; // - - - - - - - - - - - - - - - - - -
    // UTILS

    function queryElements() {
      $.each(EL, function (k, v) {
        EL[k] = $(v); // get each element in list
      });
    } // - - - - - - - - - - - - - - - - - -
    // HELPERS


    function addLinksFor(nom) {
      var items = EL[nom].find('li').clone();
      items.addClass(nom).appendTo(EL.list);
      items.first().addClass('first').end().last().addClass('last');
    }

    function addCopyright() {
      var $closer = $('<a href="#Top">[ Leave Menu ]</a>');
      var $item = $('<li class="footer copyright"></li>');
      var foot = $('footer .copyright').find('p:first')[0];
      if (foot) $item.text(foot.innerText);
      $item.append($closer.addClass('kb-only'));
      EL.list.append($item);
    }

    function fillMenu() {
      addLinksFor('global');
      addLinksFor('primary'); // addLinksFor('secondary');

      addLinksFor('footer');
      addCopyright();
      EL.wrap.append(EL.list);
    } // - - - - - - - - - - - - - - - - - -
    // INITS


    function init() {
      queryElements(); // find goodies

      if (!EL.wrap.length) return; // bail if none

      fillMenu();
      W.console.debug('inited mobile-menu-make', EL);
    }

    $(init);
  });

  /*global jQuery, bodyScroll, */
  jQuery(function ($) {

    const W = window;
    const $W = $(W);
    var DF = {
      anchorOffset: 66
    };
    var EL = {
      // list of items we want to use
      body: 'body',
      bar: 'header nav .nav-global',
      trigger: 'header nav .nav-global .toggle',
      closer: '#MobileMenu .kb-only',
      list: '#MobileMenu ul.mobile',
      wrap: '#MobileMenu'
    }; // - - - - - - - - - - - - - - - - - -
    // UTILS

    function defer(fn, ms, arg) {
      W.setTimeout(function () {
        fn(arg);
      }, ms || 99);
    }

    function gatherElements() {
      $.each(EL, function (k, v) {
        EL[k] = $(v); // get each element in list
      });
      EL.bar.attr('tabindex', '-1'); // allows menu dismissal
    }

    function getHash() {
      return W.location.hash.slice(1);
    }

    function getState() {
      return getHash() === 'Menu';
    }

    function setAnchor(str) {
      var hash = str ? '#' + str : '';
      var loc = W.location;
      var url = loc.origin + loc.pathname;
      W.history.replaceState({}, str, url + hash);
    } // - - - - - - - - - - - - - - - - - -
    // HELPERS


    function focusMenu() {
      EL.list.find('a').first().focus();
    }

    function showMenu(bool) {
      if (bool) {
        bodyScroll.freeze(); // help touch users to not scroll by accident

        EL.wrap.addClass('active');
        defer(focusMenu, 333);
      } else {
        bodyScroll.unfreeze(location.hash, DF.anchorOffset);
        EL.wrap.removeClass('active');
      }
    } // - - - - - - - - - - - - - - - - - -
    // HANDLERS


    function hashChange(evt) {
      evt = evt.originalEvent || {};
      var close = (evt.oldURL || '').match(/#Menu$/);

      if (getState()) {
        showMenu(true);
      } else {
        if (close) showMenu(false);
      }
    }

    function setState(arg) {
      if (arg === true) {
        setAnchor('Menu');
        showMenu(true);
      } else {
        setAnchor();
        showMenu(false);
      }
    }

    function setStateOff() {
      setState(false);
    }

    function checkFocus(evt) {
      var focus = evt.relatedTarget;
      if (EL.list.has(focus).length) return; // W.console.debug('checkFocus', focus);

      if (focus !== null) defer(setState, null, false);
    }

    function toggleMenu(evt) {
      evt.preventDefault();
      setState(!getState());
    }

    function wrapAround(evt) {
      evt.stopPropagation();
      focusMenu();
    }

    function bindMenu() {
      $W.on('hashchange', hashChange); // $W.on('resize', setState); // Mobile fires this when going back up page!
      //$W.on('orientationchange', setStateOff);

      $W.on('resize', function () {
        if ($(this).width() >= 768 && $(this).width() < 770) {
          setStateOff();
        }

        if ($(this).width() < 271) {
          setStateOff();
        }
      });
      EL.trigger.on('click', toggleMenu);
      EL.list.on('focusout', checkFocus);
      EL.closer.on('focusout', wrapAround);
      $W.on('Escape', setState);
    } // - - - - - - - - - - - - - - - - - -
    // INITS


    function init() {
      gatherElements(); // find goodies

      if (!EL.wrap.length) return; // bail if none

      bindMenu();
      if (getState()) setState(false); // always hide
      // changedState(); // set visibility

      W.console.debug('inited mobile-menu-bind', EL);
    }

    $(init);
  });

  /*global jQuery, */
  window.Modal = function ($) {

    var NOM = 'Modal';
    var W = window;
    var C = W.console; // C.debug(NOM, 'loaded');
    // - - - - - - - - - - - - - - - - - -

    var API = {
      cleaners: $.Callbacks(),
      _closer: null,
      _opener: null,
      current: null,
      submodal: null
    };
    var DF = {
      entering: '<span class="ada" tabindex="0">Entering dialog content</span>',
      closer: '<a class="closer noprint" href="#" aria-label="Close dialog"><i class="ada">X</i></a>',
      closers: '.closer, .cancel',
      // possible closers
      leaving: '<span class="ada" tabindex="0">Leaving dialog content</span>',
      trig: 'click keyup swiperight'
    };
    var EL = {
      all: 'body *',
      modal: '#Modal',
      sibs: '',
      entering: '',
      leaving: ''
    };
    var UTIL = {
      ensureCloser: function (submodal) {
        if (DF.closer && !UTIL.contains(submodal, '.closer')) {
          $(DF.closer).prependTo(submodal);
        }

        return submodal;
      },
      contains: function (jq, sel) {
        return Boolean(jq.is(sel) || jq.has(sel).length);
      },
      focus: function (bool) {
        var str = bool ? '_closer' : '_opener';

        try {
          // loop back or restore focus
          if (API[str]) {
            API[str].focus();
            API[str] = null;
          }
        } catch (err) {
          C.info(NOM, 'No ' + str + ' to focus upon.', err);
        }
      },
      focusOn: function () {
        UTIL.focus(true);
      },
      focusOff: function () {
        UTIL.focus(false);
      },
      hideSiblings: function (bool) {
        if (bool) {
          $('html').css('overflow', 'hidden'); // stopScroll

          EL.sibs.attr('aria-hidden', true).addClass('noprint');
        } else {
          $('html').css('overflow', ''); // startScroll

          EL.sibs.attr('aria-hidden', null).removeClass('noprint');
        }
      },
      outsideModal: function (ele) {
        return !EL.modal.has(ele).length;
      }
    }; // - - - - - - - - - - - - - - - - - -
    // HELPERS

    function trySetup(setup, data) {
      var cancel;

      try {
        if (data === API.current) {
          cancel = true;
        } else if (setup && setup(data) === false) {
          cancel = true;
        }
      } catch (err) {
        C.error(NOM, 'trySetup', err);
      }

      return !cancel;
    }

    function show(submodal) {
      submodal = $(submodal);
      API.submodal = submodal;
      UTIL.ensureCloser(submodal);
      UTIL.hideSiblings(true); // activate container, hide kids, feature one

      EL.modal.css('left', 0) //
      .addClass('active') //
      .find('> div').hide();

      if (submodal.length) {
        submodal.fadeIn(function () {
          API._closer = submodal.find('.closer').first();
          $.delay(UTIL.focusOn, 333);
        });
      }

      return API;
    }

    function hide() {
      UTIL.hideSiblings(false); // deactivate container and do whatever cleaning

      if (EL.modal.is('.active')) {
        // prevent cleaners loop
        EL.modal.removeClass('active');
        API.cleaners.fire(API.current);
        API.current = null;
      }

      $.delay(UTIL.focusOff, 333);
      return API;
    }

    function handleEvent(evt, data, setup) {
      if (UTIL.outsideModal(evt.target)) {
        API._opener = data.openers; // remember departure point
      }

      if (evt.keyCode === undefined || evt.key === 'Enter') {
        if (!data.hash()) {
          evt.preventDefault(); // do not trigger whole links
        }
      } else if (evt.key !== 'Spacebar') {
        return; // allow for spacebar open
      }

      if (trySetup(setup, data)) {
        show(data.submodal);
        API.current = data;
      }
    }

    function makeDataObj(openers, submodal) {
      var data = {
        source: EL.all.not(EL.modal).find(openers),
        target: EL.modal.find(submodal)
      };
      return $.extend(data, {
        openers: data.source,
        submodal: data.target,
        href: function () {
          return this.openers.attr('href') || '';
        },
        hash: function () {
          var frag = this.href().charAt(0) === '#';
          return frag ? this.href() : false;
        }
      });
    }

    function bindLink(openers, submodal, setup, cleanup) {
      var data = makeDataObj(openers, submodal);
      API.cleaners.add(cleanup); // recurse or reject?

      if (data.openers.length > 1) {
        return data.openers.each(function (i, e) {
          bindLink(e, submodal, setup); // do not double cleanups
        });
      } else if (data.openers.data(NOM)) {
        // C.debug(NOM + ' bound already');
        return;
      }

      data.openers.on(DF.trig, function (evt) {
        evt.preventDefault(); // do not change hash

        handleEvent(evt, data, setup);
      }).data(NOM, data);
      return data;
    }

    function addCleaner(cb) {
      API.cleaners.add(cb);
    }

    function checkClose(evt) {
      var ele = $(evt.target);
      var isCloser = ele.is(EL.modal) || ele.is(DF.closers);
      var doClose = isCloser && $.isAffirmative(evt, DF.trig);

      if (doClose) {
        evt.preventDefault(); // do not change hash

        hide();
      }
    }

    function autoTarget() {
      // auto bind these elements to sub-modal targets
      var $all = $('[data-modal-target]');
      $all.each(function () {
        var trigger = $(this);
        var target = trigger.data('modal-target');
        bindLink('[data-modal-target=' + target + ']', '#Modal-' + target);
      });
    }

    function init() {
      // gather all useful element references
      $.reify(EL);
      EL.sibs = EL.modal.siblings();
      EL.entering = $(DF.entering).prependTo(EL.modal).on('focus', hide);
      EL.leaving = $(DF.leaving).appendTo(EL.modal).on('focus', UTIL.focusOn); // check potential close events

      EL.modal.on(DF.trig, checkClose);
      autoTarget(); // run after inits

      return API;
    } // - - - - - - - - - - - - - - - - - -
    // DELEGATE (for looser coupling)


    $.subscribe(NOM + ':show', function (evt, ele) {
      API.show(ele);
    });
    $.subscribe(NOM + ':hide escapekey', function () {
      API.hide();
    });
    $.extend(API, {
      DF: DF,
      EL: EL,
      UTIL: UTIL,
      //
      addCleaner: addCleaner,
      bindLinkTo: bindLink,
      bind: bindLink,
      hide: hide,
      show: show
    });
    return init(); // init with JQ
  }(jQuery);

  /* eslint-disable no-console */

  /*global jQuery, Modal */
  jQuery(function ($) {

    var NOM = 'Interstitial';
    var CON = {
      // configuration
      exitbox: '#Modal-interstitial',
      // thing to show
      gobutton: '.call-to-action .btn-primary',
      newtab: '_blank',
      // empty to reuse same tab
      triggers: '.external, [target=external]',
      // intercept these
      events: 'click keyup'
    };
    var API = {
      _: NOM,
      configs: CON,
      Modal: Modal
    };

    function bindDialog() {
      // offsite dialog
      Modal.bind(CON.triggers, CON.exitbox, function (data) {
        // data is passed from Modal
        var btn = CON.exitbox.find(CON.gobutton); // find the go button

        var src = data.source[0];
        var tgt = src.target || CON.newtab || null;
        btn.attr({
          href: src.href,
          // transfer url
          rel: 'noopener',
          // ensure opener is null
          target: tgt
        }).on(CON.events, function (evt) {
          if ($.isAffirmative(evt, CON.events)) Modal.hide();
        });
      });
    } // - - - - - - - - - - - - - - - - - -
    // INIT?


    function init() {
      CON.exitbox = $(CON.exitbox);
      CON.triggers = $(CON.triggers);
      if (!CON.triggers.length) return;
      bindDialog();
      console.debug('inited modal-interstitial', API);
      return API;
    }

    return init(); // inited with JQ
  });

  /* eslint-disable no-console */

  /*global jQuery, */
  jQuery(function ($) {
    // ref: https://www.hassellinclusion.com/blog/accessible-accordion-pattern/

    var $containers = $('.accordion-container');
    var counter = 1; // global id counter

    var selector = '.accordion-toggle'; // set accordions heading level to look out for
    // - - - - - - - - - - - - - - - - - -
    // UTILS (stand alone)

    function defer(fn) {
      window.setTimeout(fn, 11);
    }

    function hideMe(evt) {
      var $panel = $(evt.target);
      if ($panel.is('.collapsed')) $panel.addClass('hide');
    }

    function hideAccordion($btn) {
      var my_idx = $btn.attr('data-id');
      var $panel = $('#accordion-panel-' + my_idx);
      $panel.addClass('collapsed');
      $btn.attr('aria-expanded', 'false');
      return $panel;
    }

    function showAccordion($btn) {
      var my_idx = $btn.attr('data-id');
      var $panel = $('#accordion-panel-' + my_idx);
      $panel.removeClass('hide');
      defer(function () {
        $panel.removeClass('collapsed');
      });
      $btn.attr('aria-expanded', 'true');
      return $panel;
    } // - - - - - - - - - - - - - - - - - -
    // BUILDERS


    function makeButton(num, str) {
      return $('<button>').attr({
        'data-id': num,
        'id': 'accordion-button-' + num,
        'aria-controls': 'accordion-panel-' + num,
        'aria-expanded': false
      }).html(str);
    }

    function makePanel($ele, num) {
      return $('<div>').attr({
        'class': 'accordion-panel collapsed hide',
        'id': 'accordion-panel-' + num,
        // 'tabindex': -1,
        'aria-labelledby': 'accordion-button-' + num
      }).on('transitionend', hideMe);
    }

    function makeExpander($group) {
      var $expander = $('<button>').addClass('accordion-expander btn-tertiary');
      var $buttons = $group.find('.accordion-toggle button');

      var setExpander = function () {
        var closed = $buttons.filter('[aria-expanded="false"]').length;
        if (closed) $expander.text('Expand all').addClass('normal');else $expander.text('Collapse all').removeClass('normal');
      };

      $buttons.on('click', setExpander);
      $expander.text('Expand all').addClass('normal').on('click', function () {
        if ($expander.is('.normal')) {
          $buttons.filter('[aria-expanded="false"]').each(function () {
            showAccordion($(this));
          });
        } else {
          $buttons.filter('[aria-expanded="true"]').each(function () {
            hideAccordion($(this));
          });
        }

        setExpander();
      });
      return $expander;
    }

    function addExpandAllButton($group) {
      var $expander = makeExpander($group);
      $group.prepend($expander);
    } // - - - - - - - - - - - - - - - - - -
    // HANDLERS


    function showPreExpanded($group) {
      $group.find('.expanded button').each(function () {
        showAccordion($(this));
      });
    }

    function togglePanel() {
      // jshint validthis:true
      var $btn = $(this);

      if ($btn.attr('aria-expanded') === 'true') {
        hideAccordion($btn);
      } else {
        showAccordion($btn);
      }
    } // - - - - - - - - - - - - - - - - - -
    // INITS


    function initContainer() {
      // jshint validthis:true
      var $group = $(this);
      showPreExpanded($group);
      addExpandAllButton($group);
    }

    function initAccordian() {
      // jshint validthis:true
      var $this = $(this);
      var my_id = counter++;
      var my_text = $this.html();
      var $my_button = makeButton(my_id, my_text).on('click', togglePanel);
      var $my_panel = makePanel($this, my_id);
      var $set = $this.nextUntil(selector); // everything until next selector
      // Wrap everything in a the accordion panel that is collapsed by default and shown on demand.

      $set.wrapAll($my_panel);
      $this.empty().append($my_button);
    }

    function init() {
      if (!$containers.length) return; // bail if none

      $containers.find(selector).each(initAccordian);
      $containers.each(initContainer);
      console.debug('inited accordion', $containers);
    }

    $(init);
  });

  /* eslint-disable no-console */

  /*global jQuery, YT, */
  jQuery(function ($) {

    var C = window.console;
    var API = {
      name: 'VideosYT',
      $players: 'div.video-youtube',
      dataName: 'ytkey',
      players: []
    }; // - - - - - - - - - - - - - - - - - -
    // HANDLERS

    function _returnToStartWhenDone(evt) {
      if (evt.data === 0) {
        // evt.target.seekTo(0); evt.target.pauseVideo();
        evt.target.stopVideo();
      }
    }

    function pauseAllVids() {
      $.each(API.players, function () {
        if (this.pauseVideo) this.pauseVideo();
      });
    } // - - - - - - - - - - - - - - - - - -
    // BUILDERS


    function _appendPlayer() {
      // jshint validthis:true
      var $el = $(this);
      var eid = $el.attr('id');
      var player;
      if (!eid) throw 'Video missing id';
      player = new YT.Player(eid, {
        videoId: $el.data(API.dataName),
        playerVars: {
          //- enablejsapi: 1, // https://developers.google.com/youtube/iframe_api_reference
          cc_load_policy: 1,
          modestbranding: 1
        }
      });
      API.players.push(player);
      player.addEventListener('onStateChange', _returnToStartWhenDone);
    }

    function bootstrapYT() {
      // dumps youtube api into page
      if (window.onYouTubePlayerAPIReady) return;
      var tag = document.createElement('script');
      var firstScriptTag = document.getElementsByTagName('script')[0];
      tag.src = 'https://www.youtube.com/player_api';
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubePlayerAPIReady = function () {
        $(API.$players).each(_appendPlayer);
      };
    } // - - - - - - - - - - - - - - - - - -
    // INITS


    function init() {
      API.$players = $(API.$players);
      API.pause = pauseAllVids;
      if (!API.$players.length) return;
      bootstrapYT();
      C.debug('inited video-youtube', API);
      window[API.name] = API;
    }

    $(init);
  });

  /*global jQuery, */

  jQuery(function ($) {
    $(document).scroll(function () {
      var y = $(this).scrollTop();

      if (y > 600) {
        $('.backtop').fadeIn();
      } else {
        $('.backtop').fadeOut();
      }
    });
  });

  /*global jQuery, */

  jQuery(function ($) {
    const $W = $(window); // - - - - - - - - - - - - - - - - - -
    // INIT Nav tweaker

    let $navs = $('.nav-primary li a, .sidebar li a');
    let fileName = location.pathname.split('/').pop();

    if (fileName) {
      $navs.each(function () {
        if (this.getAttribute('href').indexOf(fileName) < 0) return;
        $(this).parent().addClass('active');
        $(this).attr('aria-current', 'page');
      });
    } // - - - - - - - - - - - - - - - - - -
    // INIT Publishing


    $W.on('keydown', function (evt) {
      if (evt.key === 'Escape') $W.trigger('Escape');
    });
    window.console.debug('inited misc');
  });

}));
