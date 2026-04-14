namespace pulsenet.Models;

using Keyboard;

public record PulsenetSettings
{
    public KeyboardShortcut ToggleHotkey { get; set; } = new([KeyboardKey.F3]);
    public string YoutubeChannelId { get; set; } = string.Empty;
    public int WebViewWidthPct { get; set; } = 100;
    public int WebViewHeightPct { get; set; } = 100;
    public int WebViewZoomPct { get; set; } = 100;
    public bool AutoStartWithWindows { get; set; } = false;
    public Guid InstallationId { get; init; } = Guid.NewGuid();
}
