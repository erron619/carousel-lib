export default class Carousel {
    options = {
        accessibility: true,                    // enables tabbing and arrow key navigation
        adaptiveHeight: false,                  // enables adaptive height for single slide horizontal carousels
        arrowNext: "<button>Next</button>",     // allows you to select a node or customize the HTML for the "next" arrow
        arrowPrev: "<button>Prev</button>",     // allows you to select a node or customize the HTML for the "previous" arrow
        arrows: false,                          // enable/disable prev/next arrows
        autoplay: true,                         // enables autoplay
        center: false,                          // enables centered view with partial prev/next slides. use with odd numbered frame counts
        class: "carousel",                      // prefix name for creating required carousel's classes
        current: 0,                             // slide to start on
        dotCustom: function(index) {            // custom paging templates
            const elm = document.createElement("button");
            elm.textContent = index + 1;
            return elm;
        },
        dots: false,                            // show dot indicators
        draggable: true,                        // enable mouse dragging
        easing: "cubic-bezier(0.4, 0, 0.2, 1)", // CSS animation easing function
        fade: false,                            // enable fade
        focus: false,                           // enable focus on selected element (click)
        frame: 1,                               // number of slides to show on each frame (page)
        friction: 0.15,                         // resistance when swiping edges of non-infinite carousels
        gap: 8,                                 // the gap between slides
        grid: false,                            // enables grid mode
        gridCols: 1,                            // when grid mode is enabled, this sets how many slides are in each grid row
        gridRows: 1,                            // when grid mode is enabled, this sets how many rows each page has
        infinite: false,                        // infinite loop sliding
        lazy: "ondemand",                       // set lazy loading technique. accepts ondemand/progressive
        mobileFirst: false,                     // responsive settings use mobile first calculation
        navFor: "",                             // set the slider to be the navigation of other slider (class or ID)
        pauseDots: false,                       // pause autoplay when a dot is hovered
        pauseFocus: true,                       // pause autoplay on focus
        pauseHover: true,                       // pause autoplay on hover
        respondTo: "window",                    // width that responsive object responds to. can be window/slider/min (the smaller of the two)
        responsive: {},                         // object containing breakpoints and settings objects. enables settings sets at given screen width. set settings to "unslick" instead of an object to disable slick at a given breakpoint
        rtl: false,                             // change the slider's direction to become right-to-left
        scroll: 1,                              // number of slides to scroll
        speed: 300,                             // slide/fade animation speed
        swipe: true,                            // enable swiping
        swipeSlides: false,                     // allow users to drag or swipe directly to a slide irrespective of "scroll"
        touchMove: true,                        // enable slide motion with touch
        touchThreshold: 5,                      // to advance slides, the user must swipe a length of (1/touchThreshold) * the width of the slider
        transform: true,                        // enable/disable CSS transforms
        transform: true,                        // enable/disable CSS transforms
        variableWidth: false,                   // variable width slides
        vertical: false,                        // vertical slide mode
        wait: 3000,                             // autoplay speed in milliseconds
        waitAnimation: true,                    // ignores requests to advance the slide while animating
        zindex: 1000,                           // set the z-index values for slides
    }
    animating = false;
    autoplayTimer = null;
    css_position = null;
    currentDirection = 0;
    currentLeft = null;
    dragging = false;
    elm_arrowNext = null;
    elm_arrowPrev = null;
    elm_container = null;
    elm_slideTrack = null;
    elm_slides = [];
    ev_afterChange = new Event("afterChange");
    ev_beforeChange = new Event("beforeChange");
    ev_init = new Event("init");
    ev_setPosition = new Event("setPosition");
    group_arrows = null;
    group_dots = null;
    group_slides = null;
    gs_height = null;
    gs_width = null;
    interrupted = false;
    original_options = null;
    paused = true;
    scrolling = false;
    shouldClick = true;
    slideCount = 0;
    slideCurrent = 0;
    slideOffset = 0;
    slideWidth = null;
    swipeLeft = null;
    swiping = false;
    touch_currentX = null;
    touch_currentY = null;
    touch_edgeHit = null;
    touch_fingerCount = null;
    touch_minSwipe = null;
    touch_startX = null;
    touch_startY = null;
    touch_swipeLength = null;
    constructor(element, settings) {
        this.options = {...this.options, ...settings};
        this.original_options = this.options;
        this.elm_container = document.querySelector(element);
        this.slideCurrent = this.options.current;
        this.#registerBreakpoints();
        this.#init(true);
    }
    #init(creation) {
        this.#css(this.elm_container, {"visibility": "hidden"});
        this.#buildGrid();
        this.#buildOut();
        this.#generalCssProps();
        this.#sliderCssProps();
        this.#initEvents();
        this.#updateArrows();
        this.#updateDots();
        this.#checkResponsive();
        this.#focusHandler();
        if (this.options.accessibility) this.#initADA();
        if (this.options.autoplay) {
            this.paused = false;
            this.#autoplay();
        }
        this.#css(this.elm_container, {"visibility": "visible"});
        if (creation) this.#emit(this.elm_container, this.ev_init);
    }
    #buildOut() {
        this.group_slides = document.createElement("div");
        this.group_slides.classList.add(this.#classname("slides"));
        if (this.options.draggable) this.group_slides.classList.add(this.#classname("draggable"));
        this.elm_slideTrack = document.createElement("div");
        this.elm_slideTrack.classList.add(this.#classname("track"));
        this.elm_slides = this.#children(this.elm_container);
        this.slideCount = this.elm_slides.length;
        this.elm_slides.forEach((item, index) => {
            item.classList.add(this.#classname("slide"));
            item.setAttribute("index", index);
            this.elm_slideTrack.append(item);
        });
        this.group_slides.append(this.elm_slideTrack);
        this.elm_container.append(this.group_slides);
        this.#setupInfinite();
        this.#buildArrows();
        this.#buildDots();
        this.#updateDots();
        this.#setSlideClasses(this.slideCurrent);
    }
    #buildGrid() {
        if (!this.options.grid) return;
        const coef = this.options.gridRows * this.options.gridCols;
        const slides = this.#children(this.elm_container);
        const pagesNum = Math.ceil(slides.length / coef);
        let gridTemplateRows = [], gridTemplateColumns = [];
        this.#for(this.options.gridRows, () => {gridTemplateRows.push("1fr")});
        this.#for(this.options.gridCols, () => {gridTemplateColumns.push("1fr")});
        for (let i = 0; i < pagesNum; i++) {
            const page = document.createElement("div");
            for (let j = i * coef; j < coef * (i + 1); j++) {
                if (slides[j]) page.append(slides[j]);
            }
            this.#css(page, {
                "display": "grid",
                "grid-template-rows": gridTemplateRows.join(" "),
                "grid-template-columns": gridTemplateColumns.join(" "),
                "gap": this.options.gap + "px",
            });
            this.elm_container.append(page);
        }
    }
    #setSlideClasses(index) {
        const hasSlideClass = this.#children(this.elm_slideTrack, this.#classname("slide", "."));
        hasSlideClass.forEach(item => {
            item.classList.remove(this.#classname("active"));
            item.classList.remove(this.#classname("center"));
            item.classList.remove(this.#classname("current"));
            item.setAttribute("aria-hidden", true);
        });
        this.elm_slides[index].classList.add(this.#classname("current"));
        if (this.options.center) {}
        else {
            if (index >= 0 && index <= this.slideCount - this.options.frame) {
                this.elm_slides
                .slice(index, index + this.options.frame)
                .forEach(item => {
                    item.classList.add(this.#classname("active"));
                    item.setAttribute("aria-hidden", false);
                });
            }
            else if (hasSlideClass.length <= this.options.frame) {
                hasSlideClass.forEach(item => {
                    item.classList.add(this.#classname("active"));
                    item.setAttribute("aria-hidden", false);
                });
            }
            else {
                const remainder = this.slideCount % this.options.frame;
                const offset = this.options.infinite ? this.options.frame + index : index;
                if (this.options.frame == this.options.scroll && this.slideCount - index < this.options.frame) {
                    hasSlideClass
                    .slice(offset - this.options.frame - remainder, offset + remainder)
                    .forEach(item => {
                        item.classList.add(this.#classname("active"));
                        item.setAttribute("aria-hidden", false);
                    });
                }
                else {
                    hasSlideClass
                    .slice(offset, offset + this.options.frame)
                    .forEach(item => {
                        item.classList.add(this.#classname("active"));
                        item.setAttribute("aria-hidden", false);
                    });
                }
            }
        }
    }
    #setupInfinite() {}
    #buildArrows() {
        if (!this.options.arrows) return;
        this.group_arrows = document.createElement("div");
        this.group_arrows.classList.add(this.#classname("arrows"));
        this.elm_container.prepend(this.group_arrows);
        this.elm_arrowNext = document.createElement("div");
        this.elm_arrowPrev = document.createElement("div");
        const both = [this.elm_arrowNext, this.elm_arrowPrev];
        both.forEach(item => {
            item.classList.add(this.#classname("arrow"));
            this.group_arrows.append(item);
        });
        this.elm_arrowNext.insertAdjacentHTML("afterbegin", this.options.arrowNext);
        this.elm_arrowPrev.insertAdjacentHTML("afterbegin", this.options.arrowPrev);
        if (this.slideCount > this.options.frame) {
            both.forEach(item => {
                item.classList.remove(this.#classname("hidden"));
                item.removeAttribute("aria-hidden");
                item.removeAttribute("tabindex");
            });
            if (!this.options.infinite) {
                this.elm_arrowPrev.classList.remove(this.#classname("disabled"));
                this.elm_arrowPrev.setAttribute("aria-disabled", true);
            }
        }
        else {
            both.forEach(item => {
                item.classList.add(this.#classname("hidden"));
                item.setAttribute("aria-disabled", true);
                item.setAttribute("tabindex", -1);
            });
        }
    }
    #buildDots() {
        if (!this.options.dots && this.slideCount < this.options.frame) return;
        this.group_dots = document.createElement("ul");
        this.group_dots.classList.add(this.#classname("dots"));
        this.elm_container.append(this.group_dots);
        this.#for(this.#getDotCount() + 1, i => {
            const dot = document.createElement("li");
            dot.append(this.options.dotCustom(i));
            this.group_dots.append(dot);
        });
    }
    #getDotCount() {
        let pages = 0;
        const loop = () => {
            let counter = 0;
            let breakpoint = 0;
            while (breakpoint < this.slideCount) {
                pages++;
                breakpoint = counter + this.options.scroll;
                if (this.options.scroll <= this.options.frame) counter += this.options.scroll;
                else counter += this.options.frame;
            }
        }
        if (this.options.infinite) {
            if (this.slideCount <= this.options.frame) pages = 1;
            else loop();
        }
        else if (this.options.center) pages = this.slideCount;
        else if (!this.options.navFor) {
            pages = 1 + Math.ceil((this.slideCount - this.options.frame) / this.options.scroll);
        }
        else loop();
        return pages - 1;
    }
    #generalCssProps() {
        this.#css(this.elm_container, {
            "position": "relative",
        });
        this.#css(this.group_slides, {
            "position": "relative",
            "overflow": "hidden",
            "display": "block",
            "width": "100%",
        });
        this.#css(this.elm_slideTrack, {
            "position": "relative",
            "display": "flex",
            "gap": this.options.gap + "px",
        });
        this.elm_slides.forEach(item => {
            this.#css(item, {
                "flex-grow": 0,
                "flex-shrink": 0,
            });
        });
        if (this.options.vertical) {
            this.css_position = "top";
            this.elm_container.classList.add(this.#classname("vertical"));
            this.#css(this.elm_slideTrack, {"flex-direction": "column"});
        } 
        else {
            this.css_position = "left";
            this.elm_container.classList.remove(this.#classname("vertical"));
            this.#css(this.elm_slideTrack, {"flex-direction": "row"});
        } 
        if (this.options.fade && this.options.zindex < 3) this.options.zindex = 3;
    }
    #sliderCssProps() {
        this.#setPosition();
        this.#initUI();
        if (this.options.lazy == "progressive") this.#progressiveLazyLoad();
    }
    #setPosition() {
        this.#setDimensions();
        this.#setHeight();
        if (this.options.fade) this.#setFade();
        else this.#setcss(this.#getLeft(this.slideCurrent));
        this.#emit(this.elm_container, this.ev_setPosition);
    }
    #setcss(position) {
        if (this.options.rtl) position = -position;
        if (this.options.transform) {
            const x = this.css_position == "left" ? Math.ceil(position) : 0;
            const y = this.css_position == "top" ? Math.ceil(position) : 0;
            this.#css(this.elm_slideTrack, {"transform": `translate(${x}px, ${y}px)`});
        }
        else {
            let positionProp = {};
            positionProp[this.css_position] = position + "px";
            this.#css(this.elm_slideTrack, positionProp);
        }
            
    }
    #getLeft(index) {
        let targetLeft;
        this.slideOffset = 0;
        if (this.options.infinite) {}
        else {
            if (index + this.options.frame > this.slideCount) {
                const remainder = (index + this.options.frame - this.slideCount);
                this.slideOffset = this.slideWidth * remainder + this.options.gap * remainder;
            }
        }
        if (this.slideCount <= this.options.frame) {
            this.slideOffset = 0;
            verticalOffset = 0;
        }
        if (this.options.center) {}
        if (this.options.vertical) {}
        else targetLeft = this.slideOffset - (index * this.slideWidth + index * this.options.gap);
        if (this.options.variableWidth) {}
        return targetLeft;
    }
    #setFade() {}
    #setDimensions() {
        this.gs_width = this.#width(this.group_slides);
        this.gs_height = this.#height(this.group_slides);
        const hasSlideClass = this.#children(this.elm_slideTrack, this.#classname("slide", "."));
        const all_gaps = (hasSlideClass.length - 1) * this.options.gap;
        if (this.options.vertical) {}
        else {
            if (this.options.variableWidth) {}
            else {
                const frame_gaps = (this.options.frame - 1) * this.options.gap;
                this.slideWidth = Math.floor((this.gs_width - frame_gaps) / this.options.frame);
                this.#width(this.elm_slideTrack, Math.floor(this.slideWidth * hasSlideClass.length + all_gaps));
            }
        }
        if (!this.options.variableWidth) hasSlideClass.forEach(item => this.#width(item, this.slideWidth));
    }
    #setHeight() {
        if (this.options.frame == 1 && this.options.adaptiveHeight && !this.options.vertical) {
            this.#css(this.group_slides, {"height": this.#height(this.elm_slides[this.slideCurrent]) + "px"});
        }
    }
    #initUI() {
        if (this.slideCount <= this.options.frame) return;
        if (this.options.arrows) {
            this.#css(this.elm_arrowNext, {"visibility": "visible"});
            this.#css(this.elm_arrowPrev, {"visibility": "visible"});
        }
        if (this.options.dots) this.#css(this.group_dots, {"visibility": "visible"});
    }
    #progressiveLazyLoad() {}
    #initEvents() {
        this.#initArrowEvents();
        this.#initDotEvents();
        this.#initSlideEvents();
        this.#event(this.group_slides, "touchstart mousedown", e => this.#swipeHandler(e, "start"));
        this.#event(this.group_slides, "touchmove mousemove", e => this.#swipeHandler(e, "move"));
        this.#event(this.group_slides, "touchend mouseup touchcancel mouseleave", e => this.#swipeHandler(e, "end"));
        this.#event(this.group_slides, "click", e => this.#clickHandler(e));
        this.#event(document, "visibilityChange", e => this.#visibility(e));
        this.#event(window, "orientationchange", e => this.#orientationChange(e));
        this.#event(window, "resize", e => this.#resize(e));
        this.#event(window, "load", e => this.#setPosition());
        if (this.options.accessibility) this.#event(this.group_slides, "keydown", e => this.#keyHandler(e));
        if (this.options.focus) this.#event(this.elm_slideTrack, "click", e => this.#selectHandler(e));
        if (!this.options.draggable) this.#event(this.elm_slideTrack, "dragstart", e => this.#preventDefault(e));
    }
    #initArrowEvents() {
        if (!this.options.arrows || this.slideCount < this.options.frame) return;
        this.#event(this.elm_arrowNext, "click", e => this.#changeSlide(e, "next"));
        this.#event(this.elm_arrowPrev, "click", e => this.#changeSlide(e, "prev"));
        if (this.options.accessibility) {
            this.#event(this.elm_arrowNext, "keydown", e => this.#keyHandler(e));
            this.#event(this.elm_arrowPrev, "keydown", e => this.#keyHandler(e));
        }
    }
    #changeSlide(e, message, dontAnimate) {
        let target = e.currentTarget;
        if (target.tagName == "A")  target = e.preventDefault();
        if (target.tagName == "LI") target = target.closest("li");
        const unevenOffset = this.slideCount % this.options.scroll != 0;
        const indexOffset  = unevenOffset ? 0 : (this.slideCount - this.slideCurrent) % this.options.scroll;
        const action = {
            prev: () => {
                const slideOffset = indexOffset == 0 ? this.options.scroll : this.options.frame - indexOffset;
                if (this.slideCount > this.options.frame) this.#slideHandler(this.slideCurrent - slideOffset, false, dontAnimate);
            },
            next: () => {
                const slideOffset = indexOffset == 0 ? this.options.scroll : indexOffset;
                if (this.slideCount > this.options.frame) this.#slideHandler(this.slideCurrent + slideOffset, false, dontAnimate);
            },
            index: ()  => {
                const group_dots = [...this.group_dots.children];
                const index = group_dots.indexOf(target) * this.options.scroll;
                this.#slideHandler(this.#checkNavigable(index), false, dontAnimate);
                this.#children(target).forEach(item => item.focus());
            }
        }
        action[message].call();
    }
    #checkNavigable(index) {
        const navigables = this.#getNavigableIndexes();
        if (index > navigables[-1]) index = navigables[-1];
        else {
            let prevNavigable = 0;
            for (let i in navigables) {
                if (index < navigables[i]) {
                    index = prevNavigable;
                    break;
                }
                prevNavigable = navigables[i];
            }
        }
        return index;
    }
    #getNavigableIndexes() {
        let indexes = [];
        let breakpoint = 0;
        let counter = 0;
        let max;
        if (this.options.infinite) {
            breakpoint = this.options.scroll * -1;
            counter = this.options.scroll * -1;
            max = this.slideCount * 2;
        }
        else max = this.slideCount;
        while (breakpoint < max) {
            indexes.push(breakpoint);
            breakpoint = counter + this.options.scroll;
            counter += this.options.scroll <= this.options.frame ? this.options.scroll : this.options.frame;
        }
        return indexes;
    }
    #slideHandler(index, sync = false, dontAnimate) {
        if (this.animating && this.options.waitAnimation) return;
        if (this.options.fade && this.slideCurrent == index) return;
        if (!sync) this.#asNavFor(index);
        let targetSlide = index;
        const targetLeft = this.#getLeft(targetSlide);
        const slideLeft = this.#getLeft(this.slideCurrent);
        this.currentLeft = this.swipeLeft == null ? slideLeft : this.swipeLeft;
        if (!this.options.infinite) {
            if (this.options.center && (index < 0 || index > this.slideCount - this.options.scroll)) {}
            else if (index < 0 || index > this.#getDotCount() * this.options.scroll) {
                if (!this.options.fade) {
                    targetSlide = this.slideCurrent;
                    this.#postSlide(targetSlide)
                }
                return;
            }
        }
        if (this.options.autoplay) clearInterval(this.autoplayTimer);
        let animeSlide;
        if (targetSlide < 0) {
            if (this.slideCount % this.options.scroll != 0) animeSlide = this.slideCount - this.slideCount % this.options.scroll;
            else animeSlide = this.slideCount + targetSlide;
        }
        else if (targetSlide >= this.slideCount) {
            if (this.slideCount % this.options.scroll != 0) animeSlide = 0;
            else animeSlide = targetSlide - this.slideCount;
        }
        else animeSlide = targetSlide;
        this.animating = true;
        this.#emit(this.elm_container, this.ev_beforeChange);
        const oldSlide = this.slideCurrent;
        this.slideCurrent = animeSlide;
        this.#setSlideClasses(this.slideCurrent);
        if (this.options.navFor) {}
        this.#updateDots();
        this.#updateArrows();
        if (this.options.fade) {}
        if (!dontAnimate && this.slideCount > this.options.frame) this.#animateSlide(targetLeft, () => this.#postSlide(animeSlide));
        else this.#postSlide(animeSlide);
    }
    #animateSlide(targetLeft, callback) {
        this.#animateHeight();
        if (this.options.rtl && !this.options.vertical) targetLeft = -targetLeft;
        if (this.options.transform) {
            if (this.options.rtl) this.currentLeft = -this.currentLeft;
            if (this.options.vertical) this.#animate(this.elm_slideTrack, {"transform": `translate(0px, ${targetLeft}px)`}, this.options.speed, callback);
            else this.#animate(this.elm_slideTrack, {"transform": `translate(${targetLeft}px, 0px)`}, this.options.speed, callback);
        }
        else {
            if (this.options.vertical) this.#animate(this.elm_slideTrack, {"top": targetLeft + "px"}, this.options.speed, callback);
            else this.#animate(this.elm_slideTrack, {"left": targetLeft + "px"}, this.options.speed, callback);
        }
    }
    #animateHeight() {
        if (this.options.frame != 1 || !this.options.adaptiveHeight || this.options.vertical) return;
        const targetHeight = this.#height(this.elm_slides[this.slideCurrent]);
        this.#animate(this.group_slides, {"height": targetHeight + "px"}, this.options.speed);
    }
    #postSlide(index) {
        this.#emit(this.elm_container, this.ev_afterChange);
        this.animating = false;
        if (this.slideCount > this.options.frame) this.#setPosition();
        this.swipeLeft = null;
        if (this.options.autoplay) this.#autoplay();
        if (this.options.accessibility) {
            this.#initADA();
            if (this.options.focus) {
                this.elm_slides[this.slideCurrent].setAttribute("tabindex", 0);
                this.elm_slides[this.slideCurrent].focus();
            }
        }
    }
    #initDotEvents() {
        if (!this.options.dots) return;
        if (this.slideCount > this.options.frame) {
            this.#children(this.group_dots, "li").forEach(item => {
                this.#event(item, "click", e => this.#changeSlide(e, "index"));
                if (this.options.pauseDots) {
                    this.#event(item, "mouseenter", e => this.#interrupt(true));
                    this.#event(item, "mouseleave", e => this.#interrupt(false));
                }
            });
            if (this.options.accessibility) this.#event(this.group_dots, "keydown", e => this.#keyHandler(e));
        }
    }
    #asNavFor(index) {}
    #interrupt(toggle) {
        if (!toggle) this.#autoplay();
        this.interrupted = toggle;
    }
    #initSlideEvents() {}
    #swipeHandler() {}
    #clickHandler() {}
    #keyHandler() {}
    #selectHandler() {}
    #orientationChange() {}
    #visibility() {}
    #resize() {}
    #preventDefault() {}
    #updateArrows() {
        if (!this.options.arrows || this.slideCount <= this.options.frame || this.options.infinite) return;
        const activate = (pass, rejected) => {
            pass.classList.remove(this.#classname("disabled"));
            rejected.classList.add(this.#classname("disabled"));
            rejected.setAttribute("aria-disabled", true);
        }
        [this.elm_arrowNext, this.elm_arrowPrev].forEach(item => {
            item.classList.remove(this.#classname("disabled"));
            item.setAttribute("aria-disabled", false);
        });
        if (this.slideCurrent == 0) activate(this.elm_arrowNext, this.elm_arrowPrev);
        else if (this.slideCurrent >= this.slideCount - this.options.frame && !this.options.center) activate(this.elm_arrowPrev, this.elm_arrowNext);
        else if (this.slideCurrent >= this.slideCount - 1 && this.options.center) activate(this.elm_arrowPrev, this.elm_arrowNext);
    }
    #updateDots() {
        if (!this.group_dots) return;
        this.#children(this.group_dots).forEach((item, index) => {
            if (index == Math.floor(this.slideCurrent / this.options.scroll)) {
                item.classList.add(this.#classname("active"));
            }
            else item.classList.remove(this.#classname("active"));
        });
    }
    #checkResponsive() {}
    #focusHandler() {}
    #initADA() {}
    #autoplay() {}
    #registerBreakpoints() {}
    // tools ==================================================
    #animate(elm, properties, duration, complete) {
        const animation_props = {
            "transition-property": "all",
            "transition-duration": duration + "ms",
            "transition-timing-function": this.options.easing,
        }
        this.#css(elm, {...animation_props, ...properties});
        setTimeout(() => {
            this.#cssRemove(elm, Object.keys(animation_props));
            if (complete) complete.call(this);
        }, duration);
    }
    #boxmodel(elm) {
        const style = window.getComputedStyle(elm);
        return {
            height:  parseInt(style.height),
            width:   parseInt(style.width),
            b_top:   parseInt(style.borderTopWidth),
            b_bot:   parseInt(style.borderBottomWidth),
            b_left:  parseInt(style.borderLeftWidth),
            b_right: parseInt(style.borderRightWidth),
            b_y:     parseInt(style.borderTopWidth) + parseInt(style.borderBottomWidth),
            b_x:     parseInt(style.borderLeftWidth) + parseInt(style.borderRightWidth),
            m_top:   parseInt(style.marginTop),
            m_bot:   parseInt(style.marginBottom),
            m_left:  parseInt(style.marginLeft),
            m_right: parseInt(style.marginRight),
            m_y:     parseInt(style.marginTop) + parseInt(style.marginBottom),
            m_x:     parseInt(style.marginLeft) + parseInt(style.marginRight),
            p_top:   parseInt(style.paddingTop),
            p_bot:   parseInt(style.paddingBottom),
            p_left:  parseInt(style.paddingLeft),
            p_right: parseInt(style.paddingRight),
            p_y:     parseInt(style.paddingTop) + parseInt(style.paddingBottom),
            p_x:     parseInt(style.paddingLeft) + parseInt(style.paddingRight),
        }
    }
    #children(elm, selector) { 
        if (selector) return [...elm.querySelectorAll(selector)];
        else return [...elm.children];
    }
    #classname(name, prefix = "") {return prefix + this.options.class + "-" + name}
    #css(elm, properties) {
        Object.entries(properties).forEach(item => {
            elm.style[item[0]] = item[1];
        });
    }
    #cssRemove(elm, properties) {
        const style = elm.getAttribute("style");
        if (!style) return;
        const props_arr = Array.isArray(properties) ? properties : properties.split(" ");
        let style_arr = style.split(";");
        style_arr.forEach((item, index) => {
            style_arr[index] = item
            .split(" ")
            .filter(_item => { return _item != "" })
        });
        style_arr.forEach((item, index) => {
            if (!item[0]) return;
            const checker = item[0].slice(0, -1);
            if (props_arr.indexOf(checker) != -1) style_arr[index] = [];
            else style_arr[index] = item.join(" ");
        });
        style_arr = style_arr.filter(item => {return item.length != 0});
        style_arr = style_arr.join("; ") + ";";
        elm.style = style_arr;
    }
    #emit (elm, event) {elm.dispatchEvent(event)}
    #event(elm, events, callback) {
        events.split(" ").forEach(event => {
            elm.addEventListener(event, e => { callback(e) });
        });
    }
    #for(count, callback) { for (let i = 0; i < count; i++) callback(i) }
    #height(elm, value) { 
        if (value) this.#css(elm, {"height": value + "px"});
        else {
            const box = this.#boxmodel(elm);
            return box.m_y + box.b_y + box.p_y + box.height;
        }
    }
    #width(elm, value) {
        if (value) this.#css(elm, {"width": value + "px"});
        else {
            const box = this.#boxmodel(elm);
            return box.m_x + box.b_x + box.p_x + box.width;
        }
    }
}