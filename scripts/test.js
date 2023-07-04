Element.prototype.css = function(styleObject) {
    Object.entries(styleObject).forEach(item => {
        this.style[item[0]] = item[1];
    });
    return this;
}
const hey = "hey!!";
export default class Test {
    // ---------------
    group_arrows = null;
    group_dots = null;
    group_slides = null;
    // ---------------
    paused = true;
    animating = false;
    autoplayTimer = null;
    // ---------------
    elm_container = null;
    elm_slideTrack = null;
    elm_slides = [];
    elm_arrowNext = null;
    elm_arrowPrev = null;
    // ---------------
    slideCurrent = 0;
    slideCount = 0;
    slideWidth = null;
    slideOffset = 0;
    currentLeft = null;
    // ---------------
    gs_width = null;
    gs_height = null;
    // ---------------
    css_position = null;
    // ---------------
    touch_startX = null;
    touch_startY = null;
    touch_currentX = null;
    touch_currentY = null;
    touch_fingerCount = null;
    touch_minSwipe = null;
    touch_swipeLength = null;
    touch_edgeHit = null;
    interrupted = false;
    dragging = false;
    swiping = false;
    scrolling = false;
    swipeLeft = null;
    shouldClick = true;
    currentDirection = 0;
    // ---------------
    constructor(element, options) {
        const defaults = {
            // ---------------
            arrows: false,
            arrowNext: `<button>Next</button>`,
            arrowPrev: `<button>Prev</button>`,
            // ---------------
            autoplay: false,
            // enable fade
            fade: false, 
            // add easing for animate
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            // easing: "linear",
            speed: 300,
            transform: true,
            waitForAnimate: true,
            // ---------------
            adaptiveHeight: false,
            variableWidth: false,
            // ---------------
            center: false,
            infinite: false,
            rtl: false,
            vertical: false,
            // ---------------
            gap: 0,
            // ---------------
            draggable: true,
            // ---------------
            lazy: "",
            // ---------------
            class: "carousel",
            // ---------------
            dots: false,
            dotsCustom: function(index) {
                const elm = document.createElement("button");
                elm.textContent = index + 1;
                return elm;
            },
            // ---------------
            frame: 1,
            scroll: 1,
            current: 0,
            // ---------------
            navFor: null,
            // ---------------
            zindex: 1000,
            // ---------------
            swipe: true,
            draggable: true,
            swipeLenght: 5,
            // resistance when swiping edges of non-infinite carousels
            edgeFriction: 0.35,
            touchMove: true,
            swipeToSlide: false,
            // enable focus on selected element (click)
            focus: false,
        }
        this.options = {...defaults , ...options};
        this.elm_container = document.querySelector(element);
        if (this.options.fade) this.options.center = false;
        this.#registerBreakpoints();
        this.#init(true);
    }
    // main //=================================================
    #init(creation) {
        // hide carousel and show it after initialization
        this.elm_container.css({ "display": "hidden" });
        if (!this.elm_container.classList.contains(this.#namer("initialized"))) {
            this.elm_container.classList.add(this.#namer("initialized"));
            // this.#buildGrid();
            this.#buildOut();
            this.#generalCssProps();
            this.#sliderCssProps();
            this.#initEvents();
        }
        if (creation) {
            // trigger "init" event, pass 'this' as argument
        }
        if (this.options.autoplay) {
            this.paused = false;
            this.#autoplay();
        }
        this.elm_container.css({ "display": "block" });
    }
    #generalCssProps() {
        this.elm_container.css({
            "position": "relative",
        });
        this.group_slides.css({
            "position": "relative",
            "overflow": "hidden",
            "display": "block",
            "width": "100%",
        });
        this.elm_slideTrack.css({
            "position": "relative",
            "display": "flex",
            "gap": this.options.gap + "px",
        });
        const hasSlideClass = [...this.elm_slideTrack.children].filter(item => { return item.classList.contains(this.#namer("slide")) });
        hasSlideClass.forEach(item => item.css({
            "flex-grow": 0,
            "flex-shrink": 0,
        }));
        if (this.options.vertical) {
            this.css_position = "top";
            this.elm_container.classList.add(this.#namer("vertical"));
            this.elm_slideTrack.css({ "flex-direction": "column" });
        }
        else {
            this.css_position = "left";
            this.elm_container.classList.remove(this.#namer("vertical"));
            if (this.options.rtl) this.elm_slideTrack.css({ "flex-direction": "row-reverse" });
            else this.elm_slideTrack.css({ "flex-direction": "row" });
        }
        if (this.options.fade) {
            if (this.options.zindex < 3) this.options.zindex = 3;
        }
    }
    #registerBreakpoints() {}
    #autoplay() {}
    // build //================================================
    #buildOut() {
        // grab valid slides, give them "slide" class and push them into elm_slides
        [...this.elm_container.children].forEach(item => {
            if (!item.classList.contains(this.#namer("cloned"))) {
                item.classList.add(this.#namer("slide"));
                this.elm_slides.push(item);
            }
        });
        // init slideCount
        this.slideCount = this.elm_slides.length;
        // set "index" attr for each slides
        this.elm_slides.forEach((item, index) => item.setAttribute("index", index));
        // set container's class
        this.elm_container.classList.add(this.#namer("container"));
        // create and init elm_slideTrack
        this.elm_slideTrack = document.createElement("div");
        this.elm_slideTrack.classList.add(this.#namer("track"));
        if (this.slideCount != 0) {
            [...this.elm_container.children].forEach(item => this.elm_slideTrack.append(item));
        }
        // create and init group_slides
        this.group_slides = document.createElement("div");
        this.group_slides.classList.add(this.#namer("slides"));
        this.group_slides.append(this.elm_slideTrack);
        this.elm_container.append(this.group_slides);

        this.#setupInfinite();
        this.#buildArrows();
        this.#buildDots();
        this.#updateDots();
        if (this.options.current) this.slideCurrent = this.options.current;
        this.#setSlideClasses(this.slideCurrent);
        if (this.options.draggable) this.group_slides.classList.add(this.#namer("draggable"));
    }
    #setupInfinite() {
        let infiniteCount = this.options.frame;
        if (this.options.infinite) {
            if (this.slideCount > this.options.frame) {
                if (this.options.center) infiniteCount++;
                const clonesCount = this.slideCount - infiniteCount;
                // from last parts to the first
                for (let i = this.slideCount; i > clonesCount; i--) {
                    const index = i - 1;
                    const clone = this.elm_slides[index].cloneNode(true);
                    clone.removeAttribute("id");
                    clone.classList.add(this.#namer("cloned"));
                    clone.setAttribute("index", index - this.slideCount);
                    this.elm_slideTrack.prepend(clone);
                }
                // from first parts to the last
                for (let i = 0; i < this.slideCount - clonesCount; i++) {
                    const index = i;
                    const clone = this.elm_slides[index].cloneNode(true);
                    clone.removeAttribute("id");
                    clone.setAttribute("index", index + this.slideCount);
                    clone.classList.add(this.#namer("cloned"));
                    this.elm_slideTrack.append(clone);
                }
            }
        }
    }
    #buildArrows() {
        if (this.options.arrows) {
            // create and init group
            this.this.group_arrows = document.createElement("div");
            this.this.group_arrows.classList.add(this.#namer("arrows"));
            // create and init arrows
            this.this.group_arrows.insertAdjacentHTML("afterbegin", this.options.arrowNext);
            this.this.group_arrows.insertAdjacentHTML("afterbegin", this.options.arrowPrev);
            this.elm_arrowNext = this.this.group_arrows.children[1];
            this.elm_arrowPrev = this.this.group_arrows.children[0];
            this.elm_arrowNext.classList.add(this.#namer("arrow"));
            this.elm_arrowPrev.classList.add(this.#namer("arrow"));
            // show, hide or disable arrows on creation
            if (this.slideCount > this.options.frame) {
                this.elm_arrowPrev.classList.remove(this.#namer("hidden"));
                this.elm_arrowNext.classList.remove(this.#namer("hidden"));
                if (!this.options.infinite) {
                    this.elm_arrowPrev.classList.add(this.#namer("disabled"));
                }
            }
            else {
                next.classList.add(this.#namer("hidden"));
                prev.classList.add(this.#namer("hidden"));
            }
            // add group to the container
            this.elm_container.prepend(this.this.group_arrows);
        }
    }
    #buildDots() {
        if (this.options.dots && this.slideCount >= this.options.frame) {
            // create and init group
            this.group_dots = document.createElement("ul");
            this.group_dots.classList.add(this.#namer("dots"));
            // create and add a dot
            // getDotsCount() returns pages count of the carousel
            // dotsCustom(index) returns a dot elm
            for (let i = 0; i < this.#getDotsCount(); i++) {
                const dot = document.createElement("li");
                dot.append(this.options.dotsCustom(i));
                this.group_dots.append(dot);
            }
            // add group to the container
            this.elm_container.append(this.group_dots);
        }
    }
    #getDotsCount() {
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
    #updateDots() {
        // give "active" class to the correct dot based on current slide and framing
        if (this.options.dots) {
            const expectedSlide = Math.floor(this.slideCurrent / this.options.scroll);
            [...this.group_dots.children].forEach((item, index) => {
                if (index == expectedSlide) item.classList.add(this.#namer("active"));
                else item.classList.remove(this.#namer("active"));
            });
        }
    }
    #updateArrows() {}
    #setSlideClasses(index) {
        const hasSlideClass = this.#hasSlideClass();
        const setActive = (inHasSlideClass, min, max) => {
            const array = inHasSlideClass ? hasSlideClass : this.elm_slides;
            for (let i = min; i < max; i++) if (array[i]) array[i].classList.add(this.#namer("active"));
        }
        // remove all specified classes from all slides
        hasSlideClass.forEach(item => item.classList.remove(this.#namer("active"), this.#namer("center"), this.#namer("current")));
        // add "current" class to current slide
        this.elm_slides[index].classList.add(this.#namer("current"));
        // give correct slides "active" class
        // The "active" means which slides are present on the frame and can be interacted with
        if (this.options.center) {
            // give the current slide "center" class
            this.elm_slides[index].classList.add(this.#namer("center"));
            if (this.options.infinite) {
                // calc even coefficient
                let evenCoef;
                if (this.options.frame % 2 == 0) evenCoef = 1;
                else evenCoef = 0;
                // find the (slide in the) middle of the frame
                let centerOffset = Math.floor(this.options.frame / 2);
                if (centerOffset <= index && index <= (this.slideCount - 1) - centerOffset) {
                    const min = index - centerOffset + evenCoef;
                    const max = index + centerOffset + 1;
                    setActive(true, min, max);
                }
                else {
                    const indexOffset = this.options.frame + index;
                    const min = indexOffset - centerOffset + evenCoef + 1;
                    const max = indexOffset + centerOffset + 2;
                    setActive(true, min, max);
                }
                // also give the "center" class to the twin slide
                if (index == 0) {
                    const i = hasSlideClass.length - this.options.frame - 1;
                    hasSlideClass[i].classList.add(this.#namer("center"));
                }
                if (index == this.slideCount - 1) {
                    hasSlideClass[this.options.frame].classList.add(this.#namer("center"));
                }
            }
        }
        else {
            if (index >= 0 && index <= this.slideCount - this.options.frame) {
                // NOTE: why should we not use setActive?
                /* When we set infinite to true, the setActive returns
                the original slides and the cloned slides; Therefore, the "i" 
                counter includes the cloned slides */
                setActive(false, index, index + this.options.frame);
            }
            // when the count of slides is so small that it doesn't complete even one frame
            else if (hasSlideClass.length <= this.options.frame) {
                hasSlideClass.forEach(item => { item.classList.add(this.#namer("active"))});
            }
            else {
                const remainder = this.slideCount % this.options.frame;
                const indexOffset = this.options.infinite ? this.options.frame + index : index;
                const condition1 = this.options.frame == this.options.scroll;
                const condition2 = this.slideCount - index < this.options.frame;
                if (condition1 && condition2) {
                    setActive(true, indexOffset - this.options.frame - remainder, indexOffset + remainder);
                }
                else {
                    setActive(true, indexOffset, indexOffset + this.options.frame);
                }
            }
        }
    }
    // properties //===========================================
    #sliderCssProps() {
        this.#setPosition();
        this.#initUI();
        if (this.options.lazyLoad == "progressive") this.#progressiveLazyLoad();
    }
    // ** inactive code **
    #setPosition() {
        this.#setDimensions();
        this.#setAdaptiveHeight();
        if (this.options.fade) this.#setFade();
        else this.#setCSS(this.#getLeft(this.slideCurrent));
        // _.$slider.trigger('setPosition', [_]);
    }
    // ** vertical check **
    #setDimensions() {
        const hasSlideClass = [...this.elm_slideTrack.children].filter(item => { return item.classList.contains(this.#namer("slide")) });
        const gaps_all = (hasSlideClass.length - 1) * this.options.gap;
        // strange bug :/ as an example, the group_slides real width is 800px, but clientWidth and other methods returns 791px;
        // because of the above line problem, I have to recieve gs_width value with elm_container.clientWidth
        this.gs_width = this.#outerWidth(this.elm_container);
        this.gs_height = this.#outerHeight(this.group_slides);
        if (this.options.vertical) {
            this.slideWidth = Math.ceil(this.gs_height);
            this.elm_slideTrack.css({ "height": Math.ceil(this.#outerHeight(this.elm_slides[0]) * hasSlideClass.length + gaps_all) + "px" });
        }
        else {
            if (this.options.variableWidth) {
                this.elm_slideTrack.css({ "width": 1000 * this.slideCount + "px" });
            }
            else {
                const gaps_frame = (this.options.frame - 1) * this.options.gap;
                this.slideWidth = Math.round((this.gs_width - gaps_frame) / this.options.frame);
                this.elm_slideTrack.css({ "width": Math.round(this.slideWidth * hasSlideClass.length + gaps_all) + "px" });
            }
        }
        // set width for each slider
        if (!this.options.variableWidth) {
            hasSlideClass.forEach(item => { item.css({ "width": this.slideWidth + "px" }) });
        }
    }
    #setAdaptiveHeight() {
        const condition1 = this.options.frame == 1;
        const condition2 = this.options.adaptiveHeight == true;
        const condition3 = this.options.vertical == false;
        if (condition1 && condition2 && condition3) {
            const targetHeight = this.#outerHeight(this.elm_slides[this.slideCurrent]);
            this.group_slides.css({ "height": targetHeight + "px" });
        }
    }
    // ** fade check **
    #setFade() {
        this.elm_slides.forEach((item, index) => {
            const targetLeft = -1 * (this.slideWidth * index);
            item.css({ 
                "position": "relative",
                "right": targetLeft + "px",
                "top": "0",
                "z-index": this.options.zindex - 2,
                "opacity": "0"
            });
        });
        this.elm_slides[this.slideCurrent].css({ 
            "z-index": this.options.zindex - 1,
            "opacity": 1,
        });
    }
    #setCSS(position) {
        if (this.options.rtl) position = -position;
        let x = 0, y = 0;
        if (this.css_position == "left") x = Math.ceil(position);
        if (this.css_position == "top") y = Math.ceil(position);
        let positionProps = {};
        if (this.options.transform) {
            positionProps.transform = `translate(${x}px, ${y}px)`;
            this.elm_slideTrack.css(positionProps);
        }
        else {
            positionProps[this.css_position] = position + "px";
            this.elm_slideTrack.css(positionProps);
        } 
    }
    // ** vertical check **
    // ** variableWidth check **
    #getLeft(index) {
        // NOTE: go to comment "calc targetLeft" for better understanding whats going on...
        let targetLeft;
        // NOTE: why not slideCurrent? in vertical mode, all slides height are same;
        let verticalHeight = this.#outerHeight(this.elm_slides[0]);
        let verticalOffset = 0;
        // calc slideOffset and verticalOffset
        if (this.options.infinite) {
            if (this.slideCount > this.options.frame) {
                const gap_frame = (this.options.frame - 1) * this.options.gap;
                this.slideOffset = (this.slideWidth * this.options.frame + gap_frame) * -1;
                let coef = -1;
                if (this.options.vertical && this.options.center) {
                    if (this.options.frame == 1) coef = -2;
                    if (this.options.frame == 2) coef = -1.5;
                }
                verticalOffset = (verticalHeight * this.options.frame + gap_frame) * coef;
            }
            // wtf is this code?
            // // remainder: the number of slides that remain from the right side when the value of "slideCount" is not divisible by "scroll"
            // const remainder = this.slideCount % this.options.scroll;
            // if (remainder != 0) {
            //     // if we are on the last page and the number of slides is more than one frame
            //     const condition1 = index + this.options.scroll > this.slideCount;
            //     const condition2 = this.slideCount > this.options.frame;
            //     if (condition1 && condition2) {
            //         const gap_frame = this.options.gap * (remainder - 1);
            //         if (index > this.slideCount) {
            //             this.slideOffset = -1 * this.slideWidth * (this.options.frame - index - this.slideCount);
            //             verticalOffset   = -1 * verticalHeight  * (this.options.frame - index - this.slideCount);
            //         }
            //         else {
            //             console.log(remainder)
            //             this.slideOffset = -1 * (this.slideWidth * remainder + gap_frame);
            //             verticalOffset   = -1 * (verticalHeight  * remainder + gap_frame);
            //         }
            //     }
            //     console.log(this.slideOffset);
            // }
        }
        else {
            // in static (not infinite) mode, give slideOffset if currentSlide is reaching to the end
            const indexSumFrame = index + this.options.frame;
            if (indexSumFrame > this.slideCount) {
                const remainder = indexSumFrame - this.slideCount;
                this.slideOffset = this.slideWidth * remainder + this.options.gap * remainder;
                verticalHeight   = verticalHeight  * remainder + this.options.gap * remainder;
            }
        }
        if (this.slideCount <= this.options.frame) {
            this.slideOffset = 0;
            verticalHeight = 0;
        }
        if (this.options.center) {
            const a = Math.floor(this.options.frame / 2) * (this.slideWidth + this.options.gap);
            if (this.slideCount <= this.options.frame) this.slideOffset = a;
            // note that we are *adding* to offset if its infinite too
            // we subtract a gap from "a" because it has already been calculated
            else if (this.options.infinite) this.slideOffset += (a - this.options.gap) - this.slideWidth;
            else this.slideOffset = a;
        }
        // calc "targetLeft"
        if (this.options.vertical) {
            targetLeft = (index * verticalHeight * -1) + verticalOffset;
        }
        else {
            // how to calc targetLeft?
            // slideOffset: offset before main slides (like the sum of gaps and width of cloned slides)
            // sumWidth: total width of slides from first to current
            // sumGaps: gaps between first slide and the current slide + the gap between the offset and the main slides
            const sumWidths = index * this.slideWidth;
            let sumGaps;
            if (this.options.infinite) sumGaps = (index + 1) * this.options.gap;
            else sumGaps = index * this.options.gap
            // const sumGaps = this.options.infinite ? (index + 1) * this.options.gap : 0;
            targetLeft = -1 * (sumWidths + sumGaps) + this.slideOffset;
        }
        // not checked >>>>>
        if (this.options.variableWidth) {
            let targetSlide;
            const hasClassSlide = [...this.elm_slideTrack.children].filter(item => { return item.classList.contains(this.#namer("slide")) });
            if (this.slideCount <= this.options.frame || !this.options.infinite) targetSlide = hasClassSlide[index];
            else targetSlide = hasClassSlide[index + this.options.frame + 1]
            if (this.options.rtl) {
                if (targetLeft[0]) targetLeft = -1 * (this.elm_slideTrack.clientWidth - targetSlide[0].offsetLeft - targetSlide.clientWidth);
                else targetLeft = 0;
            }
            else {
                if (targetSlide[0]) targetLeft = targetSlide[0].offsetLeft * -1;
                else targetLeft = 0;
            }
            if (this.options.center) {
                if (this.slideCount <= this.options.frame || !this.options.infinite) targetSlide = hasClassSlide[index];
                else targetLeft = hasClassSlide[index + this.options.frame + 1];
                if (this.options.rtl) {
                    if (targetSlide[0]) targetLeft = -1 * (this.elm_slideTrack.clientWidth - targetSlide[0].offsetLeft);
                    else targetLeft = 0;
                }
                else {
                    if (targetSlide[0]) targetLeft = targetSlide[0].offsetLeft * -1;
                    else targetLeft = 0;
                }
                targetLeft += (this.group_slides.clientWidth - this.#outerWidth(targetSlide) / 2);
            }
        }
        return targetLeft;
    }
    // ** inactive code **
    #initUI() {
        const condition1 = this.slideCount > this.options.frame;
        if (this.options.arrows && condition1) {
            // _.$prevArrow.show();
            // _.$nextArrow.show();            
        }
        if (this.options.dots && condition1) {
            // _.$dots.show();
        }
    }
    #progressiveLazyLoad() {}
    // events //===============================================
    #initEvents() {
        // this.#initArrowEvents();
        // this.#initDotEvents();
        this.#initSlideEvents();
        // init swipping events
        this.#event(this.group_slides, "touchstart mousedown", this.#swipeHandler, "start", true);
        this.#event(this.group_slides, "touchmove mousemove", this.#swipeHandler, "move", true);
        this.#event(this.group_slides, "touchend mouseup touchcancel mouseleave", this.#swipeHandler, "end", true);
        // init click events
        // this.#event(this.group_slides, "carousel.click", this.#clickHandler);
        // enable focus on selected element (click)
        // if (this.options.focus) this.#hasSlideClass(item => { this.#event(item, "carousel.click", this.#selectHandler) });
    }
    #initArrowEvents() {}
    #initDotEvents() {}
    #initSlideEvents() {
        if (this.options.pauseOnHover) {
            this.#event(this.group_slides, "mouseenter", this.#interrupt, true);
            this.#event(this.group_slides, "mouseleave", this.#interrupt, false);
        }
    }
    #interrupt(toggle) {
        if (!toggle) this.#autoplay();
        this.interrupted = toggle;
    }
    #swipeHandler(e, action) {
        // exit if swipe is turend off
        if (!this.options.swipe) return;
        // exit if draggable turned off
        if (!this.options.draggable && e.type.indexOf("mouse") != -1) return;
        this.touch_fingerCount = e.touches ? e.touches.length : 1;
        this.touch_minSwipe = this.options.vertical ? this.gs_height / this.options.swipeLenght : this.gs_width / this.options.swipeLenght;
        // call correct behavior
        const swipeActions = {
            start: this.#swipeStart,
            move: this.#swipeMove,
            end: this.#swipeEnd,
        }
        swipeActions[action].call(this, e);
    }
    #swipeStart(e) {
        console.log(hey)
        this.interrupted = true;
        if (this.touch_fingerCount != 1 || this.slideCount <= this.options.frame) {
            this.#setTouchNull();
            return false;
        }
        this.#setTouchCurrent(e);
        this.touch_startX = this.touch_currentX;
        this.touch_startY = this.touch_currentY;
        this.dragging = true;
        console.log(hey)
    }
    #setTouchCurrent(e) {
        const finger = e.touches ? e.touches[0] : null;
        if (finger) {
            this.touch_currentX = finger.pageX;
            this.touch_currentY = finger.pageY;
        }
        else {
            this.touch_currentX = e.clientX;
            this.touch_currentY = e.clientY;
        }
    }
    #setTouchNull() {
        this.touch_currentX = null;
        this.touch_currentY = null;
        this.touch_edgeHit = null;
        this.touch_fingerCount = null;
        this.touch_minSwipe = null;
        this.touch_startX = null;
        this.touch_startY = null;
        this.touch_swipeLength = null;
    }
    // ** rtl check **
    #swipeMove(e) {
        // exit if we not dragging , scrolling, and active touches are more than one item
        if (!this.dragging || this.scrolling || this.touch_fingerCount != 1) return false;
        const currentLeft = this.#getLeft(this.slideCurrent);
        this.#setTouchCurrent(e);
        this.touch_swipeLength = Math.round(Math.abs(this.touch_currentX - this.touch_startX))
        const verticalSwipeLength = Math.round(Math.abs(this.touch_currentY - this.touch_startY))
        // we are scrolling if
        if (!this.options.vertical && !this.swiping && verticalSwipeLength > 4) {
            this.scrolling = true;
            return false;
        }
        // use verticalSwipeLength for swipeLength if vertical is true
        if (this.options.vertical) this.touch_swipeLength = verticalSwipeLength;
        // #swipeDirection() returns the direction that we are swiping (up/down/left/right);
        const swipeDirection = this.#swipeDirection();
        if (this.touch_swipeLength > 4) {
            this.swiping = true;
            e.preventDefault();
        }
        // we use positionOffset for swipeLength * positionOffset
        let positionOffset;
        if (this.options.vertical) positionOffset = this.touch_currentY > this.touch_startY ? 1 : -1
        else {
            const rtlCoef = this.options.rtl ? -1 : 1;
            const touchCoef = this.touch_currentX > this.touch_startX ? 1 : -1;
            positionOffset = rtlCoef * touchCoef;
        }
        // behaviors when we reach to the each sides end
        this.touch_edgeHit = false;
        let swipeLength = this.touch_swipeLength;
        if (!this.options.infinite) {
            // const dotsCount = this.options.ce
            const condition1 = this.slideCurrent == 0 && swipeDirection == "right";
            const condition2 = this.slideCurrent >= this.#getDotsCount() && swipeDirection == "left";
            if (condition1 || condition2) {
                swipeLength = this.touch_swipeLength * this.options.edgeFriction;
                this.touch_edgeHit = true;
            }
        }
        // calc swipeLeft
        if (this.options.vertical) this.swipeLeft = currentLeft + (swipeLength * (this.#outerHeight(this.group_slides) / this.gs_width)) * positionOffset;
        else this.swipeLeft = currentLeft + swipeLength * positionOffset;
        if (this.options.fade || !this.options.touchMove) return false;
        if (this.animating) {
            this.swipeLeft = null;
            return false;
        }
        this.#setCSS(this.swipeLeft);
    }
    #swipeDirection() {
        const distanceX = this.touch_startX - this.touch_currentX;
        const distanceY = this.touch_startY - this.touch_currentY;
        const r = Math.atan2(distanceY, distanceX);
        let swipeAngle = Math.round(r * 180 / Math.PI);
        if (swipeAngle < 0) swipeAngle = 360 - Math.abs(swipeAngle);
        if (this.options.vertical) {
            if (swipeAngle >= 35 && swipeAngle <= 135) return "down";
            else return "up";
        }
        else {
            const rtl = (rtl_true, rtl_false) => {
                if (this.options.rtl) return rtl_true;
                else return rtl_false;
            }
            if (swipeAngle <= 45 && swipeAngle >= 0) return rtl("right", "left");
            if (swipeAngle <= 360 && swipeAngle >= 315) return rtl("right", "left");
            if (swipeAngle >= 135 && swipeAngle <= 225) return rtl("left", "right");
        }
        return "vertical";
    }
    // ** unused code **
    #swipeEnd(e) {
        let slideCount;
        this.dragging = false;
        this.swiping = false;
        if (this.scrolling) {
            this.scrolling = false;
            return false;
        }
        this.interrupted = false;
        this.shouldClick = this.touch_swipeLength > 10 ? false : true;
        if (this.touch_currentX == undefined) return false;
        if (this.touch_edgeHit) {
            // _.$slider.trigger('edge', [_, _.swipeDirection() ]);
        }
        if (this.touch_swipeLength >= this.touch_minSwipe) {
            const direction = this.#swipeDirection();
            if (direction == "left" || direction == "down") {
                if (this.options.swipeToSlide) slideCount = this.#checkNavigable(this.slideCurrent + this.#getSlideCount());
                else slideCount = this.slideCurrent + this.#getSlideCount();
                this.currentDirection = 0;
            }
            if (direction == "right" || direction == "up") {
                if (this.options.swipeToSlide) slideCount = this.#checkNavigable(this.slideCurrent - this.#getSlideCount());
                else slideCount = this.slideCurrent - this.#getSlideCount();
                this.currentDirection = 1;
            }
            if (direction != "vertical") {
                this.#slideHandler(slideCount);
                this.#setTouchNull();
                // _.$slider.trigger('swipe', [_, direction ]);
            }
        }
        else {
            if (this.touch_startX != this.touch_currentX) {
                this.#slideHandler(this.slideCurrent);
                this.touch = {};
            }
        }
    }
    #checkNavigable(index) {
        const navigables = this.#getNavigableIndexes();
        let prevNavigable = 0;
        if (index > navigables[navigables.length - 1]) index = navigables[navigables.length - 1];
        else {
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
        let breakpoint = 0;
        let counter = 0;
        let indexes = [];
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
            if (this.options.scroll <= this.options.frame) counter += this.options.scroll;
            else counter += this.options.frame;
        }
        return indexes;
    }
    #getSlideCount() {
        const centerOffset = this.options.center ? this.slideWidth * Math.floor(this.options.frame / 2) : 0;
        if (this.options.swipeToSlide) {
            let swipedSlide;
            this.#hasSlideClass(item => {
                if (item.offsetLeft - centerOffset + (this.#outerWidth(index) / 2) > this.swipeLeft * -1) {
                    swipedSlide = item;
                    return false;
                }
            });
            let slidesTraversed = Math.abs(swipedSlide.getAttribute("index") - this.slideCurrent) || 1;
            return slidesTraversed;
        }
        else return this.options.scroll;
    }
    #slideHandler(index, sync = false, dontAnimate) {
        if (this.animating && this.options.waitForAnimate) return;
        if (this.options.fade && this.slideCurrent == index) return;
        if (!sync) this.#asNavFor(index);
        let targetSlide = index;
        let targetLeft = this.#getLeft(targetSlide);
        let slideLeft = this.#getLeft(this.slideCurrent);
        if (this.swipeLeft == null) this.currentLeft = slideLeft;
        else this.currentLeft = this.swipeLeft;
        if (!this.options.infinite) {
            if (this.options.center) {
                if (index < 0 || index > this.slideCount - this.options.scroll) {
                    if (!this.options.fade) {
                        targetSlide = this.slideCurrent;
                        if (!dontAnimate && this.slideCount > this.options.frame) {
                            this.#animateSlide(slideLeft, () => { this.#postSlide(targetSlide) });
                        }
                        else this.#postSlide(targetLeft);
                    }
                    return;
                }
            }
            else {
                if (index < 0 || index > this.#getDotsCount() * this.options.scroll) {
                    if (!this.options.fade) {
                        targetSlide = this.slideCurrent;
                        if (!dontAnimate && this.slideCount > this.options.frame) {
                            console.log(slideLeft, this.slideCurrent)
                            this.#animateSlide(slideLeft, () => { this.#postSlide(targetSlide) });
                        }
                        else {
                            this.#postSlide(targetSlide);
                        }
                    }
                    return;
                }
            } 
        }
        if (this.options.autoplay) clearInterval(this.autoplayTimer);
        let animSlide;
        if (targetSlide < 0) {
            if (this.slideCount % this.options.scroll != 0) {
                animSlide = this.slideCount - (this.slideCount % this.options.scroll);
            }
            else animSlide = this.slideCount + targetLeft;
        }
        else if (targetSlide >= this.slideCount) {
            if (this.slideCount % this.options.scroll != 0) {
                animSlide = 0;
            }
            else animSlide = targetSlide - this.slideCount;
        }
        else animSlide = targetSlide;
        this.animating = true;
        // _.$slider.trigger('beforeChange', [_, _.currentSlide, animSlide]);
        const oldSlide = this.slideCurrent;
        this.slideCurrent = animSlide;
        this.#setSlideClasses(this.slideCurrent);
        if (this.options.navFor) {
            let navTarget = this.#getNavTarget();
            navTarget = navTarget.#slick("getSlick");
            if (navTarget.slideCount <= navTarget.options.frame) {
                navTarget.#setSlideClasses(this.slideCurrent);
            }
        }
        this.#updateDots();
        this.#updateArrows();
        if (this.options.fade) {
            if (!dontAnimate) {
                this.#fadeSlideOut(oldSlide);
                this.#fadeSlide(animSlide, () => { this.#postSlide(animSlide) })
            }
            else this.#postSlide(animSlide);
            this.#animateHeight();
            return;
        }
        if (!dontAnimate && this.slideCount > this.options.frame) {
            this.#animateSlide(targetLeft, () => { this.#postSlide(animSlide) });
        }
        else this.#postSlide(animSlide);
    }
    #fadeSlide() {}
    #fadeSlideOut() {}
    #slick() {}
    #getNavTarget() {}
    #animateSlide(targetLeft, callback) {
        this.#animateHeight();
        if (this.options.rtl && !this.options.vertical) targetLeft = -targetLeft;
        if (this.options.transform) {
            if (this.options.vertical) this.#animate(this.elm_slideTrack, {"transform": `translate(0px, ${targetLeft}px)`}, this.options.speed, callback);
            else this.#animate(this.elm_slideTrack, {"transform": `translate(${targetLeft}px, 0px)`}, this.options.speed, callback);
        }
        else {
            // if (this.options.rtl) this.currentLeft = -this.currentLeft;
            if (this.options.vertical) this.#animate(this.elm_slideTrack, {"top": targetLeft + "px"}, this.options.speed, callback);
            else this.#animate(this.elm_slideTrack, {"left": targetLeft + "px"}, this.options.speed, callback);
        }
    }
    #animateHeight() {}
    #postSlide(index) {
        let unslicked = false;
        if (!unslicked) {
            // _.$slider.trigger('afterChange', [_, index]);
            this.animating = false;
            if (this.slideCount > this.options.frame) this.#setPosition();
            this.swipeLeft = null;
            if (this.options.autoplay) this.#autoplay();
        }
    }
    #asNavFor() {}
    #clickHandler() {}
    #selectHandler() {}
    #orientationChanged() {}
    #resize() {}
    // arrows //===============================================
    // dots //=================================================
    // responsive //===========================================
    // focus //================================================
    // tools //================================================
    #namer(name) {
        return this.options.class + "-" + name;
    }
    #event(elm, event, callback, data = [], include_e = false) {
        const event_arr = event.split(" ");
        const data_arr = Array.isArray(data) ? [...data] : [data];
        event_arr.forEach(event_item => { elm.addEventListener(event_item, e => { 
            const args = include_e ? [e, ...data_arr] : data_arr;
            callback.call(this, ...args);
        })});
    }
    #hasSlideClass(callback) {
        const arr = [...this.elm_slideTrack.children].filter(item => { return item.classList.contains(this.#namer("slide")) });
        if (callback) arr.forEach(callback);
        else return arr;
    }
    #outerHeight(elm) {
        const style = window.getComputedStyle(elm);
        const height = parseInt(style.height);
        const borderTop = parseInt(style.borderTop);
        const borderBot = parseInt(style.borderBottom);
        const marginTop = parseInt(style.marginTop);
        const marginBot = parseInt(style.marginBottom);
        return height + borderTop + borderBot + marginTop + marginBot;
    }
    #outerWidth(elm) {
        const style = window.getComputedStyle(elm);
        const width = parseInt(style.width);
        const borderLeft = parseInt(style.borderLeft);
        const borderRight = parseInt(style.borderRight);
        const marginLeft = parseInt(style.marginLeft);
        const marginRight = parseInt(style.marginRight);
        return width + borderLeft + borderRight + marginLeft + marginRight;
    }
    #CSS(elm, properties) {
        Object.entries(properties).forEach(item => {
            elm.style[item[0]] = item[1];
        });
    }
    #removeCSS(elm, properties) {
        const style = elm.getAttribute("style");
        if (!style) return;
        // part 1
        let style_arr = style.split(";");
        // part 2
        style_arr.forEach((item, index) => {
            const arr = item
            .split(" ")
            .filter(_item => { return _item != "" })
            .map((_item, _index) => { 
                if (_index == 0) return _item.slice(0, -1);
                else return _item;
            })
            style_arr[index] = arr;
        });
        // part 3
        const props_arr = Array.isArray(properties) ? properties : properties.split(" ");
        style_arr.forEach((item, index) => {
            props_arr.forEach(_item => {
                if (item[0] == _item) { return style_arr[index] = [] };
            });
        });
        // part 4
        style_arr = style_arr.filter(item => { return item.length != 0 });
        // part 5
        style_arr.forEach((item, index) => { style_arr[index] = item.join(": ") + ";" });
        // part 6
        elm.style = style_arr.join(" ");
    }
    #animate(elm, properties, duration, complete) {
        this.#CSS(elm, {...{
            "transition-property": "all",
            "transition-duration": duration + "ms",
            "transition-timing-function": this.options.easing,
        }, ...properties});
        setTimeout(() => {
            this.#removeCSS(elm, [
                "transition-property",
                "transition-duration",
                "transition-timing-function"
            ]);
            complete.call(this);
        }, duration);
    }
}