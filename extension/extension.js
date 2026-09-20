import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const HELPER = GLib.build_filenamev([GLib.get_home_dir(), '.local/bin/canvas-pendientes']);
const REFRESH_SECS = 900;

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Canvas Pendientes');
        this._label = new St.Label({text: '📚 …', yAlign: 2});
        this.add_child(this._label);
        this.menu.connect('open-state-changed', (_m, open) => open && this._refresh());
    }

    _refresh() {
        let proc;
        try {
            proc = Gio.Subprocess.new([HELPER], Gio.SubprocessFlags.STDOUT_PIPE);
        } catch (e) {
            return this._render(null, `no se pudo ejecutar ${HELPER}`);
        }
        proc.communicate_utf8_async(null, null, (p, res) => {
            try {
                const [, out] = p.communicate_utf8_finish(res);
                if (!p.get_successful())
                    return this._render(null, 'el script falló (revisa el token)');
                this._render(JSON.parse(out), null);
            } catch (e) {
                this._render(null, `error: ${e.message}`);
            }
        });
    }

    _render(data, error) {
        this.menu.removeAll();

        if (error) {
            this._label.text = '📚 !';
            this.menu.addMenuItem(new PopupMenu.PopupMenuItem(error, {reactive: false}));
        } else if (data.count === 0) {
            this._label.text = '📚 0';
            this.menu.addMenuItem(
                new PopupMenu.PopupMenuItem('Sin tareas pendientes 🎉', {reactive: false}));
        } else {
            const next = data.items[0];
            this._label.text = `📚 ${data.count} · ${next.when}`;
            for (const it of data.items) {
                const item = new PopupMenu.PopupMenuItem(`${it.title}`);
                item.add_child(new St.Label({
                    text: `  ${it.course} · ${it.when}`,
                    style: 'font-size: 11px; opacity: 0.7;',
                    yAlign: 2,
                }));
                item.connect('activate', () =>
                    Gio.AppInfo.launch_default_for_uri(it.url, null));
                this.menu.addMenuItem(item);
            }
        }

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        const refresh = new PopupMenu.PopupMenuItem('Actualizar');
        refresh.connect('activate', () => this._refresh());
        this.menu.addMenuItem(refresh);
    }
});

export default class CanvasTodoExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea('canvas-todo', this._indicator, 0, 'left');
        this._indicator._refresh();
        this._timer = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, REFRESH_SECS, () => {
            this._indicator._refresh();
            return GLib.SOURCE_CONTINUE;
        });
    }

    disable() {
        if (this._timer) {
            GLib.Source.remove(this._timer);
            this._timer = null;
        }
        this._indicator?.destroy();
        this._indicator = null;
    }
}
