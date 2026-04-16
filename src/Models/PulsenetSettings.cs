namespace pulsenet.Models;

using Keyboard;

public record PulsenetSettings
{
    public KeyboardShortcut ToggleHotkey    { get; set; } = new([KeyboardKey.F9]);
    public string YoutubeChannelId          { get; set; } = "UCIMaIJsfJEMi5yJIe5nAb0g";
    public int WebViewZoomPct               { get; set; } = 100;
    public Guid InstallationId              { get; init; } = Guid.NewGuid();
    public double? WindowLeft               { get; set; } = null;
    public double? WindowTop                { get; set; } = null;
}