#!/usr/bin/env python3
import sys
import requests
import urllib3
import json
import random
import string
import time
from typing import Dict

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def random_string(n=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))


def main():
    if len(sys.argv) < 3:
        print("Uso: python3 api_key_test.py <API_KEY> <BASE_URL>")
        sys.exit(1)

    api_key = sys.argv[1]
    base_url = sys.argv[2].rstrip('/')

    headers = {
        "X-API-Key": f"{api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    print(f"🔑 API Key: {api_key[:8]}...{api_key[-4:]}")
    print(f"🌐 URL: {base_url}")
    print(f"⚠️ SSL Verification: Desativado\n")

    while True:
        print("\n" + "="*70)
        print("🚀 MENU DE TESTES - API Key")
        print("="*70)
        print("1. Listar Workspaces")
        print("2. Ver detalhes de um Workspace")
        print("3. Criar novo Workspace")
        print("4. Atualizar Workspace")
        print("5. Deletar Workspace")
        print("6. Mudar de API Key")
        print("7. Rate Limit Test - READ (GET)")
        print("8. Rate Limit Test - WRITE (POST)")
        print("0. Sair")
        print("="*70)

        choice = input("\nEscolha uma opção: ").strip()

        if choice == "1":
            test_list_workspaces(headers, base_url)
        elif choice == "2":
            test_get_workspace(headers, base_url)
        elif choice == "3":
            test_create_workspace(headers, base_url)
        elif choice == "4":
            test_update_workspace(headers, base_url)
        elif choice == "5":
            test_delete_workspace(headers, base_url)
        elif choice == "6":
            api_key = input("Nova API Key: ").strip()
            headers["X-API-Key"] = f"{api_key}"
            print("✅ API Key atualizada!")
        elif choice == "7":
            test_rate_limit_get(headers, base_url)
        elif choice == "8":
            test_rate_limit_post(headers, base_url)
        elif choice == "0":
            print("👋 Saindo...")
            break
        else:
            print("❌ Opção inválida!")


def pretty_print(data):
    try:
        if isinstance(data, str):
            data = json.loads(data)
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except:
        print(data)


def make_request(method: str, url: str, headers: Dict, json_data=None):
    try:
        kwargs = {
            "headers": headers,
            "verify": False,
            "timeout": 10
        }
        if json_data and method in ("POST", "PUT"):
            kwargs["json"] = json_data

        if method == "GET":
            return requests.get(url, **kwargs)
        elif method == "POST":
            return requests.post(url, **kwargs)
        elif method == "PUT":
            return requests.put(url, **kwargs)
        elif method == "DELETE":
            return requests.delete(url, **kwargs)
        return None
    except requests.exceptions.Timeout:
        print("   ⏱️  Timeout - Servidor não respondeu")
        return None
    except requests.exceptions.ConnectionError:
        print("   ❌ Connection Error - Servidor recusou a conexão")
        return None
    except Exception as e:
        print(f"   ❌ Erro: {e}")
        return None


# ====================== RATE LIMIT TESTS ======================

def test_rate_limit_get(headers, base_url):
    print("\n📊 TESTE RATE LIMIT - GET (READ) - Limite: 30/min")
    print("=" * 80)
    count = 0
    max_requests = 100

    while count < max_requests:
        count += 1
        res = make_request("GET", f"{base_url}/public/workspaces", headers)
        status = res.status_code if res else "CONNECTION_ERROR"

        print(f"\nGET {count:2d} → Status: {status}")

        try:
            data = res.json()
            pretty_print(data)
        except:
            print("Resposta:", res.text[:800] if res.text else "(vazia)")

        if res.status_code == 429:
            print(f"\n🚨 RATE LIMIT ATINGIDO CORRETAMENTE no request {count}!")
            print("✅ Backend retornou 429 como esperado.")
            break

        # Pequena pausa após o limite para evitar flood
        if count >= 30:
            time.sleep(0.2)

    if count >= max_requests:
        print(f"\n⚠️  Não atingiu rate limit após {max_requests} requests.")


def test_rate_limit_post(headers, base_url):
    print("\n📊 TESTE RATE LIMIT - POST (WRITE) - Limite: 10/min")
    print("=" * 80)
    count = 0
    max_requests = 50

    while count < max_requests:
        count += 1
        payload = {
            "name": f"rl_test_post_{random_string()}",
            "description": "Teste rate limit write"
        }
        res = make_request("POST", f"{base_url}/public/workspaces", headers, payload)
        status = res.status_code if res else "CONNECTION_ERROR"

        print(f"\nPOST {count:2d} → Status: {status}")

        try:
            pretty_print(res.json())
        except:
            print("Resposta:", res.text[:800] if res.text else "(vazia)")

        if res.status_code == 429:
            print(f"\n🚨 RATE LIMIT ATINGIDO CORRETAMENTE no request {count} (POST)!")
            break

# ====================== FUNÇÕES ORIGINAIS ======================

def test_list_workspaces(headers, base_url):
    print("\n📋 Listando Workspaces...")
    resp = make_request("GET", f"{base_url}/public/workspaces", headers)
    if resp and resp.status_code == 200:
        print(f"✅ Sucesso ({resp.status_code})")
        pretty_print(resp.json())
    else:
        print(f"❌ Falha ({getattr(resp, 'status_code', 'N/A')})")


def test_get_workspace(headers, base_url):
    workspace_id = input("Digite o ID do Workspace: ").strip()
    if not workspace_id: return
    resp = make_request("GET", f"{base_url}/public/workspaces/{workspace_id}", headers)
    if resp:
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            pretty_print(resp.json())
        else:
            print(resp.text[:500])


def test_create_workspace(headers, base_url):
    name = input("Nome do Workspace: ").strip()
    if not name:
        print("Nome é obrigatório!")
        return
    description = input("Descrição (opcional): ").strip()
    payload = {"name": name, "description": description}
    resp = make_request("POST", f"{base_url}/public/workspaces", headers, payload)
    if resp:
        print(f"Status: {resp.status_code}")
        try:
            pretty_print(resp.json())
        except:
            print(resp.text)


def test_update_workspace(headers, base_url):
    workspace_id = input("ID do Workspace para atualizar: ").strip()
    if not workspace_id: return
    name = input("Novo nome (deixe vazio para manter): ").strip()
    description = input("Nova descrição (deixe vazio para manter): ").strip()
    payload = {}
    if name: payload["name"] = name
    if description: payload["description"] = description
    if not payload:
        print("Nada para atualizar.")
        return
    resp = make_request("PUT", f"{base_url}/public/workspaces/{workspace_id}", headers, payload)
    if resp:
        print(f"Status: {resp.status_code}")
        try:
            pretty_print(resp.json())
        except:
            print(resp.text)


def test_delete_workspace(headers, base_url):
    workspace_id = input("ID do Workspace para DELETAR: ").strip()
    if not workspace_id: return
    confirm = input(f"Tem CERTEZA que quer deletar o workspace {workspace_id}? (s/N): ").strip().lower()
    if confirm != 's':
        print("Cancelado.")
        return
    resp = make_request("DELETE", f"{base_url}/public/workspaces/{workspace_id}", headers)
    if resp:
        print(f"Status: {resp.status_code}")
        if resp.status_code < 400:
            print("✅ Workspace deletado com sucesso!")
        else:
            print(resp.text[:400])


if __name__ == "__main__":
    main()