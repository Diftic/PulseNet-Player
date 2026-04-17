namespace pulsenet;

internal static class Constants
{
    public const string ApplicationName = "PulseNet Player";
    public const string MutexId = "pulsenet-3C8F4A2D-91B7-4E56-8D0C-7A3F2B1E9C84";
    public const string AppDataFolderName = "pulsenet-radio";
    public const string SettingsFileName = "settings.json";
    public const string WebView2CacheFolderName = "WebView2Cache";
    public const string PlayerVirtualHost       = "pulsenet.local";
    public const string PlayerRendererFolder    = "Renderer";

    // Frame canvas dimensions — source image 2515×1292 displayed at 50%.
    public const int FrameDisplayWidth  = 1202;
    public const int FrameDisplayHeight = 646;

    // Default YouTube channel for @Mr_Xul (test/development channel).
    public const string DefaultChannelId = "UCDemStdcwUHbqhD2ePbKH6A";
}
