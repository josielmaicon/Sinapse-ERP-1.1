<?php

require __DIR__ . '/vendor/autoload.php';

use NFePHP\NFe\Tools;
use NFePHP\Common\Certificate;

// Entrada
$chave   = $argv[1] ?? null;
$pfxPath = $argv[2] ?? null;
$senha   = $argv[3] ?? null;
$cnpj    = $argv[4] ?? null;
$homolog = ($argv[5] ?? "1") === "1";

try {

    // DEBUG: validar entradas
    if (!$chave || !$pfxPath || !$senha || !$cnpj) {
        throw new Exception("Parâmetros insuficientes");
    }

    // Certificado
    $certContent = file_get_contents($pfxPath);
    if (!$certContent) {
        throw new Exception("Falha ao ler certificado PFX");
    }

    $certificate = Certificate::readPfx($certContent, $senha);

    // Config mínimo
    $config = [
        "atualizacao" => "2024-01-01",
        "tpAmb"       => $homolog ? 2 : 1,
        "razaosocial" => "EMPRESA",
        "cnpj"        => $cnpj,
        "siglaUF"     => "PR",
        "schemes"     => "PL_009_V4",
        "versao"      => "4.00"
    ];

    $tools = new Tools(json_encode($config), $certificate);

    // CONSULTAR NFE
    $response = $tools->sefazConsultaChave($chave);

    echo json_encode([
        "xml" => base64_encode($response)
    ]);

} catch (Exception $e) {
    echo json_encode([
        "error" => $e->getMessage()
    ]);
}
