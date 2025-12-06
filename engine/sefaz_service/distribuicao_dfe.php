<?php
header("Content-Type: application/json");

use NFePHP\Common\Certificate;
use NFePHP\NFe\Tools;

require_once __DIR__ . "/vendor/autoload.php";

// =======================
// 1) Parâmetros CLI
// =======================
$chave = $argv[1] ?? null;
$pfxPath = $argv[2] ?? null;
$senha = $argv[3] ?? null;
$cnpj = $argv[4] ?? null;
$producao = $argv[5] ?? "1";

if (!$chave || !$pfxPath || !$senha || !$cnpj) {
    echo json_encode([
        "status" => "error",
        "error" => "Parâmetros inválidos."
    ]);
    exit(1);
}

// =======================
// 2) Configuração NFePHP
// =======================
$tpAmb = $producao === "1" ? 1 : 2;

$config = [
    "atualizacao" => date('Y-m-d H:i:s'),
    "tpAmb" => $tpAmb,
    "razaosocial" => "EMPRESA",
    "siglaUF" => "SP",
    "cnpj" => $cnpj,
    "schemes" => "PL_009_V4",
    "versao" => "4.00",
    "proxyConf" => [
        "proxyIp" => "",
        "proxyPort" => "",
        "proxyUser" => "",
        "proxyPass" => ""
    ]
];

try {
    // =======================
    // 3) Certificado
    // =======================
    $cert = Certificate::readPfx(file_get_contents($pfxPath), $senha);
    $tools = new Tools(json_encode($config), $cert);
    $tools->model("55");

    // =======================
    // 4) Download por chave
    // =======================
    $resp = $tools->sefazDownload($chave);

    // XML normal ou compactado
    $array = json_decode(json_encode(simplexml_load_string($resp)), true);

    $xml = null;

    if (isset($array['procEventoNFe'])) {
        $xml = $resp;
    }

    if (isset($array['nfeProc'])) {
        $xml = $resp;
    }

    // Caso venha zipado
    if (isset($array['docZip'])) {
        $zip = base64_decode($array['docZip']);
        $xml = gzdecode($zip);
    }

    if (!$xml) {
        $xml = $resp; // fallback
    }

    echo json_encode([
        "status" => "ok",
        "xml_base64" => base64_encode($xml)
    ]);

} catch (\Exception $e) {
    echo json_encode([
        "status" => "error",
        "error" => $e->getMessage()
    ]);
    exit(1);
}
