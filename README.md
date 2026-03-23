# Instalação Instável

Protótipo de mini jogo em HTML, CSS e JavaScript puro.

## Estrutura

- `index.html`: ponto de entrada do jogo.
- `404.html`: fallback estático para hosts que usem página 404 customizada.
- `css/style.css`: estilos da interface e do tabuleiro.
- `js/map.js`: configuração do nível e tipos de tiles.
- `js/main.js`: lógica principal do jogo.
- `.nojekyll`: evita processamento Jekyll em GitHub Pages.

## Rodar localmente

Na raiz do projeto:

```bash
python3 -m http.server 8000
```

Depois abra:

```text
http://127.0.0.1:8000
```

## Deploy estático

Este projeto está pronto para deploy como site estático porque utiliza apenas arquivos HTML, CSS e JavaScript no cliente.

### GitHub Pages

1. Suba o repositório.
2. Vá em **Settings > Pages**.
3. Configure a publicação a partir da branch principal e da pasta raiz (`/`).
4. Aguarde a geração da URL pública.

### Netlify / Vercel / Cloudflare Pages

1. Importe o repositório.
2. Configure a pasta publicada como a raiz do projeto.
3. Não é necessário comando de build.
4. Não é necessário diretório `dist`.

## Observações

- O projeto usa caminhos relativos, então funciona bem em hosts estáticos simples.
- `404.html` foi adicionado como fallback leve para plataformas que exibem página 404 customizada.
- Não há dependências externas nem backend.
