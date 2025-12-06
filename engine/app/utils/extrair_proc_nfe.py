def extrair_proc_nfe(raw_xml: str) -> str:
    """
    Pega somente o <procNFe> de dentro do XML distribuído.
    """
    start = raw_xml.find("<procNFe")
    end = raw_xml.find("</procNFe>")

    if start == -1 or end == -1:
        raise ValueError("procNFe não encontrado no XML.")

    return raw_xml[start : end + len("</procNFe>")]
