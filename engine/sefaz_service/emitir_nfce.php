<?php
// engine/php/emitir_nfce.php

error_reporting(E_ALL & ~E_DEPRECATED & ~E_NOTICE);
ini_set('display_errors', 0);

require __DIR__ . '/vendor/autoload.php';

use NFePHP\NFe\Make;
use NFePHP\NFe\Tools;
use NFePHP\Common\Certificate;
use NFePHP\NFe\Common\Standardize;

// 1. Captura Argumentos
// argv[1] = caminho do arquivo JSON com dados da venda
// argv[2] = caminho do PFX temporário
// argv[3] = senha do PFX
$jsonPath = $argv[1] ?? null;
$pfxPath  = $argv[2] ?? null;
$senha    = $argv[3] ?? null;

try {
    if (!$jsonPath || !$pfxPath || !$senha) {
        throw new Exception("Parâmetros insuficientes para emissão.");
    }

    // 2. Carrega Dados
    $jsonContent = file_get_contents($jsonPath);
    if (!$jsonContent) throw new Exception("Falha ao ler JSON da venda.");
    
    $dados = json_decode($jsonContent, true);
    if (!$dados) throw new Exception("JSON inválido.");

    $empresa = $dados['empresa'];
    $venda   = $dados['venda'];

    // 3. Configuração NFePHP
    $config = [
        "atualizacao" => date('Y-m-d H:i:s'),
        "tpAmb"       => (int)$empresa['ambiente'], // 1=Prod, 2=Homolog
        "razaosocial" => $empresa['razao_social'],
        "cnpj"        => $empresa['cnpj'],
        "siglaUF"     => "PR", // Ajustar dinamicamente se for multi-estado
        "schemes"     => "PL_009_V4",
        "versao"      => "4.00",
        "tokenIBPT"   => "",
        "CSC"         => $empresa['csc_token'], // Obrigatório para NFC-e
        "CSCid"       => $empresa['csc_id']     // Obrigatório para NFC-e
    ];

    $certContent = file_get_contents($pfxPath);
    $certificate = Certificate::readPfx($certContent, $senha);
    $tools = new Tools(json_encode($config), $certificate);
    
    // Define o modelo (65 = NFC-e)
    $tools->model('65');

    // 4. Montagem da Nota (Classe Make)
    $nfe = new Make();

    // -- Tag IDE (Identificação) --
    $std = new stdClass();
    $std->cUF = 41; // PR (Ajustar tabela de UFs)
    $std->cNF = str_pad($venda['id'], 8, '0', STR_PAD_LEFT); // Aleatório ou ID da venda
    $std->natOp = 'VENDA AO CONSUMIDOR';
    $std->mod = 65;
    $std->serie = 1;
    $std->nNF = $venda['numero_nota'];
    $std->dhEmi = date('Y-m-d\TH:i:sP');
    $std->tpNF = 1; // Saída
    $std->idDest = 1; // Operação interna
    $std->cMunFG = 4106902; // Curitiba (Pegar do cadastro da empresa)
    $std->tpImp = 4; // DANFE NFC-e
    $std->tpEmis = 1; // Normal
    $std->tpAmb = (int)$empresa['ambiente'];
    $std->finNFe = 1; // Normal
    $std->indFinal = 1; // Consumidor final
    $std->indPres = 1; // Presencial
    $std->procEmi = 0; // App próprio
    $std->verProc = 'SinapseERP_v1';
    $nfe->tagide($std);

    // -- Tag EMIT (Emitente) --
    $std = new stdClass();
    $std->xNome = $empresa['razao_social'];
    $std->xFant = $empresa['nome_fantasia'];
    $std->IE = $empresa['ie'];
    $std->CRT = ($empresa['regime'] == 'simples') ? 1 : 3;
    $std->CNPJ = $empresa['cnpj'];
    $nfe->tagemit($std);
    
    // -- Tag ENDER EMIT (Endereço) --
    $std = new stdClass();
    $std->xLgr = "RUA TESTE"; // Pegar do cadastro
    $std->nro = "123";
    $std->xBairro = "CENTRO";
    $std->cMun = 4106902;
    $std->xMun = "Curitiba";
    $std->UF = "PR";
    $std->CEP = "80000000";
    $std->cPais = 1058;
    $std->xPais = "BRASIL";
    $nfe->tagenderEmit($std);

    // -- Tag DEST (Destinatário - Opcional na NFC-e até certo valor) --
    if (!empty($venda['cliente_cpf'])) {
        $std = new stdClass();
        if (strlen($venda['cliente_cpf']) > 11) {
            $std->CNPJ = $venda['cliente_cpf'];
        } else {
            $std->CPF = $venda['cliente_cpf'];
        }
        $std->xNome = $venda['cliente_nome'] ?: 'CONSUMIDOR';
        $std->indIEDest = 9; // Não contribuinte
        $nfe->tagdest($std);
    }

    // -- PRODUTOS --
    $i = 0;
    foreach ($venda['itens'] as $item) {
        $i++;
        $std = new stdClass();
        $std->item = $i;
        $std->cProd = $item['codigo'];
        $std->cEAN = "SEM GTIN"; // Ou o EAN real
        $std->xProd = $item['descricao'];
        $std->NCM = $item['ncm'];
        $std->CFOP = $item['cfop'];
        $std->uCom = $item['unidade'];
        $std->qCom = $item['quantidade'];
        $std->vUnCom = number_format($item['valor_unitario'], 4, '.', '');
        $std->vProd = number_format($item['valor_total'], 2, '.', '');
        $std->cEANTrib = "SEM GTIN";
        $std->uTrib = $item['unidade'];
        $std->qTrib = $item['quantidade'];
        $std->vUnTrib = number_format($item['valor_unitario'], 4, '.', '');
        $std->indTot = 1;
        $nfe->tagdet($std);

        // -- IMPOSTOS (SIMPLES NACIONAL PADRÃO - CSOSN 102) --
        // Aqui deve entrar a lógica fiscal robusta baseada no NCM/Config
        $std = new stdClass();
        $std->item = $i;
        $std->orig = 0;
        $std->CSOSN = $item['csosn'] ?: '102'; // Tributada sem crédito
        $nfe->tagICMSSN102($std);

        // PIS/COFINS (Zerado para MVP Simples, ajustar conforme regime)
        $std = new stdClass();
        $std->item = $i;
        $std->CST = '07';
        $nfe->tagPISOutr($std);
        $std = new stdClass();
        $std->item = $i;
        $std->CST = '07';
        $nfe->tagCOFINSOutr($std);
    }

    // -- TOTAIS --
    // O NFePHP não calcula sozinho, temos que passar a soma
    $std = new stdClass();
    $std->vBC = 0.00;
    $std->vICMS = 0.00;
    $std->vProd = number_format($venda['total_produtos'], 2, '.', '');
    $std->vNF = number_format($venda['total_nota'], 2, '.', '');
    $nfe->tagICMSTot($std);

    // -- TRANSPORTE (Sem frete para NFC-e) --
    $std = new stdClass();
    $std->modFrete = 9;
    $nfe->tagtransp($std);

    // -- PAGAMENTO --
    // Mapeamento simples
    $pagamentosMap = [
        'dinheiro' => '01',
        'credito' => '03',
        'debito' => '04',
        'pix' => '17'
    ];
    
    $std = new stdClass();
    $std->tPag = $pagamentosMap[$venda['forma_pagamento']] ?? '99';
    $std->vPag = number_format($venda['total_nota'], 2, '.', '');
    $nfe->tagdetPag($std);

    // 5. Assinatura e Envio
    $xml = $nfe->getXML(); // Gera o XML
    $xmlAssinado = $tools->signNFe($xml); // Assina

    // Envia para a SEFAZ
    $idLote = str_pad($venda['id'], 15, '0', STR_PAD_LEFT);
    $resp = $tools->sefazEnviaLote([$xmlAssinado], $idLote);

    // 6. Processa Retorno
    $st = new Standardize();
    $std = $st->toStd($resp);

    if ($std->cStat != 103 && $std->cStat != 104) {
        // Erro no envio do lote
        echo json_encode([
            "status" => "rejeitada",
            "cstat" => $std->cStat,
            "motivo" => $std->xMotivo,
            "xml_envio" => base64_encode($xmlAssinado)
        ]);
        exit(0);
    }

    // Se lote processado, pega o recibo
    $recibo = $std->protNFe->infProt;
    
    echo json_encode([
        "status" => ($recibo->cStat == 100) ? "autorizada" : "rejeitada",
        "cstat" => $recibo->cStat,
        "motivo" => $recibo->xMotivo,
        "protocolo" => $recibo->nProt ?? null,
        "chave" => $recibo->chNFe ?? null,
        "xml_protocolado" => base64_encode($xmlAssinado), // Idealmente montar o procNFe aqui
        "data_autorizacao" => $recibo->dhRecbto ?? null
    ]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "erro_interno",
        "motivo" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}