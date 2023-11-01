const html = require('choo/html');
const Component = require('choo/component');

class Account extends Component {
  constructor(name, state, emit) {
    super(name);
    this.state = state;
    this.emit = emit;
    this.enabled = state.capabilities.account;
    this.local = state.components[name] = {};
    this.buttonClass = '';
    this.setLocal();
  }

  avatarClick(event) {
    event.preventDefault();
    const menu = document.getElementById('accountMenu');
    menu.classList.toggle('invisible');
    menu.focus();
  }

  hideMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('accountMenu');
    menu.classList.add('invisible');
  }

  login(event) {
    event.preventDefault();
    this.emit('signup-cta', 'button');
  }

  logout(event) {
    event.preventDefault();
    this.emit('logout');
  }

  changed() {
    return this.local.loggedIn !== this.state.user.loggedIn;
  }

  setLocal() {
    const changed = this.changed();
    if (changed) {
      this.local.loggedIn = this.state.user.loggedIn;
    }
    return changed;
  }

  update() {
    return this.setLocal();
  }

  createElement() {
    if (!this.enabled) {
      return html`
        <send-account></send-account>
      `;
    }
    const user = this.state.user;
    const translate = this.state.translate;
    this.setLocal();
    if (user.loginRequired && !this.local.loggedIn) {
      return html`
        <send-account></send-account>
      `;
    }
    if (!this.local.loggedIn) {
      return html`
        <send-account>
          <button
            class="px-4 py-2 md:px-8 md:py-4 focus:outline signin border-2 link-primary border-primary hover:border-primary dark:border-primary dark:hover:border-primary"
            onclick="${e => this.login(e)}"
            title="${translate('signInOnlyButton')}"
          >
            ${translate('signInOnlyButton')}
          </button>
        </send-account>
      `;
    }
    return html`
      <send-account class="relative h-8">
        <input
          type="image"
          alt="${user.email}"
          class="w-8 h-8 rounded-full border-default text-primary md:text-white focus:outline"
          src="${user.avatar}"
          onclick="${e => this.avatarClick(e)}"
        />
        <ul
          id="accountMenu"
          class="invisible absolute top-0 right-0 mt-10 pt-2 pb-2 bg-white shadow-md whitespace-nowrap outline-none z-50 dark:bg-grey-80"
          onblur="${e => this.hideMenu(e)}"
        >
          <li class="p-2 text-grey-60 dark:text-grey-50">${user.email}</li>
          <li>
            <button
              class="block w-full text-left px-4 py-2 text-grey-80 dark:text-grey-30 hover:bg-primary hover:text-white cursor-pointer focus:outline"
              onclick="${e => this.logout(e)}"
              title="${translate('signOut')}"
            >
              ${translate('signOut')}
            </button>
          </li>
        </ul>
      </send-account>
    `;
  }
}

module.exports = Account;
