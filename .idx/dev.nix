# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.python3
    pkgs.python3Packages.pip
    pkgs.python3Packages.virtualenv
    pkgs.poetry
    pkgs.ruff
    pkgs.nodejs_22
    pkgs.pnpm
    pkgs.chromium
    pkgs.gh
  ];
  services.postgres = { enable = true; };
  services.mysql = { enable = true; package = pkgs.mariadb; };

  # Sets environment variables in the workspace
  env = {
    LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath [
      pkgs.glib
      pkgs.nss
      pkgs.nspr
      pkgs.freetype
      pkgs.fontconfig
      pkgs.cairo
      pkgs.pango
      pkgs.udev
      pkgs.at-spi2-core
      pkgs.dbus
      pkgs.expat
      pkgs.alsa-lib
      pkgs.cups
      pkgs.mesa
      pkgs.libdrm
      pkgs.libxkbcommon
      pkgs.xorg.libxcb
      pkgs.xorg.libX11
      pkgs.xorg.libXext
      pkgs.xorg.libXcursor
      pkgs.xorg.libXcomposite
      pkgs.xorg.libXdamage
      pkgs.xorg.libXfixes
      pkgs.xorg.libXrandr
      pkgs.xorg.libXrender
      pkgs.xorg.libXi
      pkgs.xorg.libXtst
    ];
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
      "google.gemini-cli-vscode-ide-companion"
    ];
    # Enable previews
    previews = {
      enable = true;
      previews = {
        # web = {
        #   # Example: run "npm run dev" with PORT set to IDX's defined port for previews,
        #   # and show it in IDX's web preview panel
        #   command = ["npm" "run" "dev"];
        #   manager = "web";
        #   env = {
        #     # Environment variables to set for your server
        #     PORT = "$PORT";
        #   };
        # };
      };
    };
    # Workspace lifecycle hooks
    workspace = {
      # Runs when a workspace is first created
      onCreate = {
        # Example: install JS dependencies from NPM
        # npm-install = "npm install";
        # Open editors for the following files by default, if they exist:
        default.openFiles = [ ".idx/dev.nix" "README.md" ];
      };
      # Runs when the workspace is (re)started
      onStart = {
        # Example: start a background task to watch and re-build backend code
        # watch-backend = "npm run watch-backend";
      };
    };
  };
}
