<?php

error_reporting(E_ALL & ~E_DEPRECATED);
ini_set('display_errors', 0);
ini_set('log_errors', 0);

require __DIR__ . '/vendor/autoload.php';

use NFePHP\NFe\Tools;
use NFePHP\Common\Certificate;

$storageDir = __DIR__ . "/storage";
if (!is_dir($storageDir)) {
    mkdir($storageDir, 0777, true);
}

$tmp = sys_get_temp_dir();
if (!is_dir($tmp)) {
    mkdir($tmp, 0777, true);
}

$chave     = $argv[1] ?? null;
$pfxPath   = $argv[2] ?? null;
$senha     = $argv[3] ?? null;
$cnpj      = $argv[4] ?? null;
$homolog   = ($argv[5] ?? "1") === "1";

try {

    if (!$chave || !$pfxPath || !$senha || !$cnpj) {
        throw new Exception("Parâmetros insuficientes");
    }

    $certContent = @file_get_contents($pfxPath);
    if (!$certContent) {
        throw new Exception("Falha ao ler certificado PFX");
    }

    $certificate = Certificate::readPfx($certContent, $senha);

    $config = [
        "atualizacao" => "2024-01-01",
        "tpAmb" => $homolog ? 2 : 1,
        "razaosocial" => "EMPRESA",
        "cnpj" => $cnpj,
        "siglaUF" => "PR",
        "schemes" => "PL_009_V4",
        "versao" => "4.00",
        "tokenIBPT" => "",
        "pathCerts" => $storageDir
    ];

    $tools = new Tools(json_encode($config), $certificate);
    $response = $tools->sefazConsultaChave($chave);

    echo json_encode([
        "raw_xml" => $response,
        "xml_base64" => base64_encode($response)
    ]);
    exit(0);

} catch (Exception $e) {
    echo json_encode([
        "error" => $e->getMessage()
    ]);
    exit(1);
}
