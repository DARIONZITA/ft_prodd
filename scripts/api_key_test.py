import sys
import requests
import urllib3
import json
from typing import Dict, Optional

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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
    print(f"⚠️  SSL Verification: Desativado (self-signed)\n")

    while True:
        print("\n" + "="*60)
        print("🚀 MENU DE TESTES - API Key")
        print("="*60)
        print("1. Listar Workspaces")
        print("2. Ver detalhes de um Workspace")
        print("3. Criar novo Workspace")
        print("4. Atualizar Workspace")
        print("5. Deletar Workspace")
        print("6. Mudar de API Key")
        print("0. Sair")
        print("="*60)

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
            #base_url = input("Nova Base URL: ").strip().rstrip('/')
            headers["X-API-Key"] = f"{api_key}"
            print("✅ Configurações atualizadas!")

        elif choice == "0":
            print("👋 Saindo...")
            break

        else:
            print("❌ Opção inválida!")


def pretty_print(data):
    """Mostra JSON de forma legível"""
    try:
        if isinstance(data, str):
            data = json.loads(data)
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except:
        print(data)


def make_request(method: str, url: str, headers: Dict, json_data=None):
    try:
        kwargs = {"headers": headers, "verify": False, "timeout": 15}
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
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return None


def test_list_workspaces(headers, base_url):
    print("\n📋 Listando Workspaces...")
    resp = make_request("GET", f"{base_url}/public/workspaces", headers)
    
    if resp and resp.status_code == 200:
        data = resp.json()
        print(f"✅ Sucesso ({resp.status_code})")
        pretty_print(data)
        
        workspaces = data.get("data", []) if isinstance(data, dict) else []
        if workspaces:
            print(f"\n📌 {len(workspaces)} workspace(s) encontrado(s)")
            for w in workspaces:
                print(f"   • ID: {w.get('id')} | Nome: {w.get('name')}")
    else:
        print(f"❌ Falha ({getattr(resp, 'status_code', 'N/A')})")


def test_get_workspace(headers, base_url):
    workspace_id = input("Digite o ID do Workspace: ").strip()
    if not workspace_id:
        return
    
    print(f"\n🔍 Buscando detalhes do workspace {workspace_id}...")
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
    
    print("\n✨ Criando Workspace...")
    resp = make_request("POST", f"{base_url}/public/workspaces", headers, payload)
    
    if resp:
        print(f"Status: {resp.status_code}")
        try:
            pretty_print(resp.json())
        except:
            print(resp.text)


def test_update_workspace(headers, base_url):
    workspace_id = input("ID do Workspace para atualizar: ").strip()
    if not workspace_id:
        return
    
    name = input("Novo nome (deixe vazio para manter): ").strip()
    description = input("Nova descrição (deixe vazio para manter): ").strip()

    payload = {}
    if name: payload["name"] = name
    if description: payload["description"] = description

    if not payload:
        print("Nada para atualizar.")
        return

    print(f"\n🔄 Atualizando Workspace {workspace_id}...")
    resp = make_request("PUT", f"{base_url}/public/workspaces/{workspace_id}", headers, payload)
    
    if resp:
        print(f"Status: {resp.status_code}")
        try:
            pretty_print(resp.json())
        except:
            print(resp.text)


def test_delete_workspace(headers, base_url):
    workspace_id = input("ID do Workspace para DELETAR: ").strip()
    if not workspace_id:
        return
    
    confirm = input(f"Tem CERTEZA que quer deletar o workspace {workspace_id}? (s/N): ").strip().lower()
    if confirm != 's':
        print("Cancelado.")
        return

    print(f"\n🗑️  Deletando Workspace {workspace_id}...")
    resp = make_request("DELETE", f"{base_url}/public/workspaces/{workspace_id}", headers)
    
    if resp:
        print(f"Status: {resp.status_code}")
        if resp.status_code < 400:
            print("✅ Workspace deletado com sucesso!")
        else:
            print(resp.text[:400])


if __name__ == "__main__":
    main()