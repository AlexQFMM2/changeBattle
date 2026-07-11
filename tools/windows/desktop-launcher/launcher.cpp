#ifndef UNICODE
#define UNICODE
#endif
#ifndef _UNICODE
#define _UNICODE
#endif

#include <windows.h>

#include <fstream>
#include <map>
#include <sstream>
#include <string>
#include <vector>

namespace {

const wchar_t *kAppTitle = L"ChangeBattle V2";
const wchar_t *kEnvFileName = L"ChangeBattle-V2-Desk.launcher.env";

std::wstring dirnameOf(const std::wstring &path) {
  const size_t slash = path.find_last_of(L"\\/");
  if (slash == std::wstring::npos) return L".";
  if (slash == 0) return path.substr(0, 1);
  return path.substr(0, slash);
}

std::wstring joinPath(const std::wstring &base, const std::wstring &relative) {
  if (base.empty()) return relative;
  if (base.back() == L'\\' || base.back() == L'/') return base + relative;
  return base + L"\\" + relative;
}

bool fileExists(const std::wstring &path) {
  const DWORD attrs = GetFileAttributesW(path.c_str());
  return attrs != INVALID_FILE_ATTRIBUTES && (attrs & FILE_ATTRIBUTE_DIRECTORY) == 0;
}

bool directoryExists(const std::wstring &path) {
  const DWORD attrs = GetFileAttributesW(path.c_str());
  return attrs != INVALID_FILE_ATTRIBUTES && (attrs & FILE_ATTRIBUTE_DIRECTORY) != 0;
}

std::wstring exePath() {
  std::vector<wchar_t> buffer(MAX_PATH);
  while (true) {
    const DWORD written = GetModuleFileNameW(nullptr, buffer.data(), static_cast<DWORD>(buffer.size()));
    if (written == 0) return L"";
    if (written < buffer.size() - 1) return std::wstring(buffer.data(), written);
    buffer.resize(buffer.size() * 2);
  }
}

std::wstring utf8ToWide(const std::string &value) {
  if (value.empty()) return L"";
  const int size = MultiByteToWideChar(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), nullptr, 0);
  if (size <= 0) return L"";
  std::wstring result(size, L'\0');
  MultiByteToWideChar(CP_UTF8, 0, value.data(), static_cast<int>(value.size()), result.data(), size);
  return result;
}

std::string trim(const std::string &value) {
  const char *spaces = " \t\r\n";
  const size_t start = value.find_first_not_of(spaces);
  if (start == std::string::npos) return "";
  const size_t end = value.find_last_not_of(spaces);
  return value.substr(start, end - start + 1);
}

std::map<std::wstring, std::wstring> readEnvFile(const std::wstring &path) {
  std::map<std::wstring, std::wstring> values;
  std::ifstream input(path.c_str(), std::ios::binary);
  if (!input) return values;

  std::string line;
  while (std::getline(input, line)) {
    if (!line.empty() && line.back() == '\r') line.pop_back();
    const std::string trimmed = trim(line);
    if (trimmed.empty() || trimmed[0] == '#') continue;
    const size_t eq = trimmed.find('=');
    if (eq == std::string::npos) continue;
    const std::string key = trim(trimmed.substr(0, eq));
    const std::string value = trim(trimmed.substr(eq + 1));
    if (!key.empty()) values[utf8ToWide(key)] = utf8ToWide(value);
  }
  return values;
}

std::wstring envOrDefault(const std::map<std::wstring, std::wstring> &env, const std::wstring &key, const std::wstring &fallback) {
  const auto it = env.find(key);
  return it == env.end() || it->second.empty() ? fallback : it->second;
}

std::wstring quoteArg(const std::wstring &arg) {
  std::wstring result = L"\"";
  size_t backslashes = 0;
  for (const wchar_t ch : arg) {
    if (ch == L'\\') {
      ++backslashes;
      continue;
    }
    if (ch == L'"') {
      result.append(backslashes * 2 + 1, L'\\');
      result.push_back(ch);
      backslashes = 0;
      continue;
    }
    result.append(backslashes, L'\\');
    backslashes = 0;
    result.push_back(ch);
  }
  result.append(backslashes * 2, L'\\');
  result.push_back(L'"');
  return result;
}

void appendLog(const std::wstring &portableRoot, const std::wstring &message) {
  const std::wstring logPath = joinPath(portableRoot, L"launcher.log");
  HANDLE file = CreateFileW(logPath.c_str(), FILE_APPEND_DATA, FILE_SHARE_READ, nullptr, OPEN_ALWAYS, FILE_ATTRIBUTE_NORMAL, nullptr);
  if (file == INVALID_HANDLE_VALUE) return;

  SYSTEMTIME now{};
  GetLocalTime(&now);
  std::wstringstream line;
  line << L"[" << now.wYear << L"-" << now.wMonth << L"-" << now.wDay << L" " << now.wHour << L":" << now.wMinute << L":" << now.wSecond << L"] " << message << L"\r\n";
  const std::wstring wide = line.str();
  const int utf8Size = WideCharToMultiByte(CP_UTF8, 0, wide.c_str(), static_cast<int>(wide.size()), nullptr, 0, nullptr, nullptr);
  if (utf8Size > 0) {
    std::string utf8(utf8Size, '\0');
    WideCharToMultiByte(CP_UTF8, 0, wide.c_str(), static_cast<int>(wide.size()), utf8.data(), utf8Size, nullptr, nullptr);
    DWORD written = 0;
    WriteFile(file, utf8.data(), static_cast<DWORD>(utf8.size()), &written, nullptr);
  }
  CloseHandle(file);
}

void fail(const std::wstring &portableRoot, const std::wstring &message) {
  appendLog(portableRoot, L"ERROR: " + message);
  MessageBoxW(nullptr, message.c_str(), kAppTitle, MB_OK | MB_ICONERROR);
}

bool setEnv(const wchar_t *name, const std::wstring &value) {
  return SetEnvironmentVariableW(name, value.c_str()) != 0;
}

}  // namespace

int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int) {
  const std::wstring currentExe = exePath();
  const std::wstring portableRoot = dirnameOf(currentExe);
  if (portableRoot.empty()) {
    MessageBoxW(nullptr, L"Cannot resolve portable root.", kAppTitle, MB_OK | MB_ICONERROR);
    return 1;
  }

  const std::wstring envPath = joinPath(portableRoot, kEnvFileName);
  const auto env = readEnvFile(envPath);
  const std::wstring electronExe = joinPath(portableRoot, L"runtime\\electron\\electron.exe");
  const std::wstring desktopApp = joinPath(portableRoot, L"apps\\desktop");
  const std::wstring desktopMain = joinPath(desktopApp, L"out\\main\\main.js");
  const std::wstring showdownVendor = joinPath(portableRoot, L"vendor\\pokemon-showdown");
  const std::wstring showdownClient = joinPath(portableRoot, L"vendor\\showdown-client\\js");

  if (!fileExists(electronExe)) {
    fail(portableRoot, L"Electron runtime is missing:\n" + electronExe);
    return 1;
  }
  if (!directoryExists(desktopApp) || !fileExists(desktopMain)) {
    fail(portableRoot, L"Desktop app build is missing:\n" + desktopMain);
    return 1;
  }
  if (!fileExists(joinPath(showdownVendor, L"sim\\index.js"))) {
    fail(portableRoot, L"Pokemon Showdown vendor is missing:\n" + joinPath(showdownVendor, L"sim\\index.js"));
    return 1;
  }
  if (!fileExists(joinPath(showdownClient, L"battle.js"))) {
    fail(portableRoot, L"Pokemon Showdown client playback vendor is missing:\n" + joinPath(showdownClient, L"battle.js"));
    return 1;
  }

  const std::wstring version = envOrDefault(env, L"CHANGEBATTLE_DESKTOP_VERSION", L"0.0.0");
  const std::wstring channel = envOrDefault(env, L"CHANGEBATTLE_RELEASE_CHANNEL", L"stable");
  const std::wstring manifestUrls = envOrDefault(env, L"CHANGEBATTLE_UPDATE_MANIFEST_URLS", L"");

  setEnv(L"CHANGEBATTLE_PROJECT_ROOT", portableRoot);
  setEnv(L"CHANGEBATTLE_DESKTOP_VERSION", version);
  setEnv(L"CHANGEBATTLE_PORTABLE_ROOT", portableRoot);
  setEnv(L"CHANGEBATTLE_PORTABLE_UPDATE_ENABLED", L"1");
  setEnv(L"CHANGEBATTLE_RELEASE_CHANNEL", channel);
  if (!manifestUrls.empty()) setEnv(L"CHANGEBATTLE_UPDATE_MANIFEST_URLS", manifestUrls);
  setEnv(L"CHANGEBATTLE_SHOWDOWN_VENDOR_ROOT", showdownVendor);
  setEnv(L"CHANGEBATTLE_SHOWDOWN_CLIENT_VENDOR_ROOT", showdownClient);

  std::wstring commandLine = quoteArg(electronExe) + L" " + quoteArg(desktopApp);
  std::vector<wchar_t> mutableCommand(commandLine.begin(), commandLine.end());
  mutableCommand.push_back(L'\0');

  STARTUPINFOW startup{};
  startup.cb = sizeof(startup);
  startup.dwFlags = STARTF_USESHOWWINDOW;
  startup.wShowWindow = SW_SHOWNORMAL;
  PROCESS_INFORMATION process{};

  appendLog(portableRoot, L"Launching " + commandLine);
  const BOOL ok = CreateProcessW(
      electronExe.c_str(),
      mutableCommand.data(),
      nullptr,
      nullptr,
      FALSE,
      CREATE_NEW_PROCESS_GROUP,
      nullptr,
      portableRoot.c_str(),
      &startup,
      &process);
  if (!ok) {
    const DWORD error = GetLastError();
    std::wstringstream message;
    message << L"Failed to launch ChangeBattle V2.\n\nError code: " << error << L"\n" << electronExe;
    fail(portableRoot, message.str());
    return 1;
  }

  CloseHandle(process.hThread);
  CloseHandle(process.hProcess);
  return 0;
}
