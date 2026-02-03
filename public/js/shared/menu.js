export const initSideMenu = ({
  menuToggleId = "menuToggle",
  menuCloseId = "menuClose",
  sideMenuId = "sideMenu",
  menuOverlayId = "menuOverlay",
} = {}) => {
  const menuToggle = document.getElementById(menuToggleId);
  const menuClose = document.getElementById(menuCloseId);
  const sideMenu = document.getElementById(sideMenuId);
  const menuOverlay = document.getElementById(menuOverlayId);

  if (!sideMenu) {
    return {
      openMenu: () => {},
      closeMenu: () => {},
      toggleMenu: () => {},
    };
  }

  const openMenu = () => {
    if (!menuOverlay || !menuToggle) {
      return;
    }
    sideMenu.classList.add("is-open");
    menuOverlay.hidden = false;
    menuToggle.setAttribute("aria-expanded", "true");
  };

  const closeMenu = () => {
    if (!menuOverlay || !menuToggle) {
      return;
    }
    sideMenu.classList.remove("is-open");
    menuOverlay.hidden = true;
    menuToggle.setAttribute("aria-expanded", "false");
  };

  const toggleMenu = () => {
    const isOpen = sideMenu.classList.contains("is-open");
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  if (menuToggle) {
    menuToggle.addEventListener("click", toggleMenu);
  }

  if (menuClose) {
    menuClose.addEventListener("click", closeMenu);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener("click", closeMenu);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  return { openMenu, closeMenu, toggleMenu };
};
