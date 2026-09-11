# Ethnicity fields

The spec lives in [store/src/ethnicities-fields.ts](../store/src/ethnicities-fields.ts).

A people, described from the inside: what they call their children, what they eat, how they bury their
dead, what they will not do.

| Field | Stored as | Covers |
| --- | --- | --- |
| **Overview** | | |
| Name | item name | Required. What the people call themselves. |
| Pronunciation | attribute | [Common to every container](containers.md#fields-every-container-gets). |
| Related Locations | attribute (list) | Where they live, came from, and are scattered to. |
| Description | item summary | Who they are and what sets them apart. Shown wherever they are mentioned. |
| **Names** | | |
| Common Masculine Names | attribute (list) | |
| Common Feminine Names | attribute (list) | |
| Common Unisex Names | attribute (list) | Many peoples have few or none. |
| Common Family Names | attribute (list) | Or whatever stands in their place. |
| **Culture** | | |
| Language(s) | attribute (list) | The first is the one they grow up in. |
| Culture & Heritage | attribute | What they believe they inherited, and what they have lost. |
| Shared Codes & Values | attribute | What is admired and despised — concretely. |
| Common Etiquette | attribute | And the mistakes outsiders reliably make. |
| Traditional Styles | attribute | Dress, hair, adornment, marking. |
| Art & Architecture | attribute | What makes it recognisably theirs. |
| Foods & Cuisine | attribute | What they eat, will not eat, and what neighbours think of it. |
| Common Customs & Traditions | attribute | The observances of an ordinary year. |
| **Rites of Passage** | | |
| Birth Rites | attribute | Including when, and by whom, a child is named. |
| Coming-of-Age Rites | attribute | |
| Funerary & Memorial Customs | attribute | |
| **Lore** | | |
| Common Taboos | attribute | And which are still kept. |
| Shared Myths & Legends | attribute | And where neighbours tell them differently. |
| Major Historical Figures | attribute (list) | |
| **Ideals** | | |
| Beauty Ideals | attribute | |
| Gender Ideals | attribute | Including where the ideal and ordinary life differ. |
| Courtship Ideals | attribute | |
| Relationship Ideals | attribute | |
| **Connections** | | |
| Associated Institutions | attribute (list) | |

## Grouped, without reordering

Twenty-seven fields in one column is a wall, so the form is sectioned. A section appears where its
first field does, and a group that turned up again later would drag its fields out of place — so the
groups follow the spec's order exactly and a test holds them to it. Pronunciation joins Overview, the
section of the name it sits beside.

## Lists where the answer is a set of names

The four name lists, languages, figures, related locations and institutions are **lists**, not prose.
Each entry that matches an article [links to it](cross-references.md), and a name list is something a
reader scans for a value rather than reads.

That matters most for the names. A person generated as Kellish is
[usually named from the Kellish lists](names.md#a-persons-own-people) — masculine or feminine to
match, plus unisex — and sometimes from anywhere else, because a list of common names is not a list of
the only names. A short list is leaned on lightly, so two names recorded do not end up naming half a
people. Every people's lists also go into the wider pool, so a name from outside a person's
own people still tends to come from this world.

## An ethnography, not a questionnaire

Nearly every field here is something any people has an answer to. That is exactly why so many are
rolled: handed twenty-seven fields, a model writes twenty-seven, and a world where every people has a
considered position on courtship reads as a form.

| Field | Rate | |
| --- | --- | --- |
| Common Unisex Names | 40% | many peoples have none |
| Major Historical Figures | 40% | a model asked for figures invents famous people |
| Birth Rites | 50% | |
| Coming-of-Age Rites | 50% | |
| Beauty Ideals | 50% | |
| Courtship Ideals | 50% | |
| Relationship Ideals | 50% | |
| Associated Institutions | 50% | |
| Common Etiquette | 60% | |
| Art & Architecture | 60% | |
| Common Taboos | 60% | |
| Shared Myths & Legends | 60% | |
| Gender Ideals | 60% | |
| Traditional Styles | 70% | |

Related Locations, Description, the masculine, feminine and family name lists, Languages, Culture &
Heritage, Shared Codes & Values, Foods & Cuisine, Common Customs & Traditions, and Funerary & Memorial
Customs carry no rate. See [fill-rates.md](fill-rates.md).
