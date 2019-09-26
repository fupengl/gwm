import Watermark from './watermark';
import CanvasWay from './core/canvas';
import ElementWay from './core/element';
import SvgWay from './core/svg';
import creator, { observer, disconnect } from './helpers/creator';
import bindCSS from './helpers/bindCSS';
import { IOptions, IGenerateWatermark, IGwmObserver, IGwmObserverEvent } from './types';

const CANVAS = 'canvas';
const SVG = 'svg';
const ELEMENT = 'element';
const DEFAULT_STYLE = {
  position: 'fixed',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  overflow: 'hidden',
  zIndex: -10,
  backgroundRepeat: 'no-repeat',
  display: 'block',
  opacity: '1',
};

const wayFactory = (mode: string, wm: Watermark) => {
  let impl = null;
  const way = [CANVAS, SVG, ELEMENT];
  if (mode) {
    mode = mode.toLowerCase();
    mode = way.indexOf(mode) >= 0 ? mode : '';
  }
  if (!mode) {
    mode = 'svg';
  }
  switch (mode) {
    case CANVAS:
      impl = new CanvasWay(wm);
      break;
    case SVG:
      impl = new SvgWay(wm);
      break;
    default:
      impl = new ElementWay(wm);
  }
  return impl;
};

const getElement = (container: HTMLElement | string): HTMLElement => {
  if (typeof container === 'string') {
    const dom: HTMLElement | null = document.querySelector(container);
    if (dom) {
      return dom;
    }
    return document.body;
  }
  return container;
};

class GenerateWatermark implements IGenerateWatermark {
  opts: IOptions;
  wrap: HTMLElement;
  gwmDom: HTMLElement;
  observer: IGwmObserver | IGwmObserverEvent;

  creation(opts: IOptions) {
    opts.css = Object.assign({}, DEFAULT_STYLE, opts.css);
    this.opts = opts;
    this.cancel();
    const { mode, watch, container = document.body } = opts;
    this.wrap = getElement(container);
    if (this.wrap !== document.body) {
      this.opts.css.position = 'absolute';
      bindCSS(this.wrap, { position: 'relative' });
    }
    this.gwmDom = creator(this);
    const wm = new Watermark(opts);
    const impl = wayFactory(mode, wm);
    const result = impl.render();
    if (mode === ELEMENT) {
      this.gwmDom.appendChild(result as HTMLDivElement);
    } else {
      this.gwmDom.style.background = `url("${result}")`;
    }
    const first = this.wrap.firstChild;
    if (first) {
      this.wrap.insertBefore(this.gwmDom, first);
    } else {
      this.wrap.appendChild(this.gwmDom);
    }
    if (watch !== !!0) {
      this.observer = this.observing();
    }
    if (opts.destroy) {
      this.creation = f => f;
    }
  }

  observing() {
    return observer(this.gwmDom, this.wrap, () => this.creation(this.opts));
  }

  cancel(): void {
    if (this.observer) {
      disconnect(this.observer);
    }
  }
}

export default new GenerateWatermark();
