# Thai address form: interface copy (TH / EN)

Placeholders: `{pc}` postal code, `{n}` count, `{k}` the level label for the current `kind` (อำเภอ/เขต, ตำบล/แขวง), `{note}` the dataset's `note` field, `{s}` the search text, `{f}` a field label.
Names come from the dataset without prefixes. Prefixes appear only in the one-line full address (see brief.md, Display format).

| Key | TH | EN |
|---|---|---|
| `legendShip` | ที่อยู่จัดส่ง | Shipping address |
| `legendTax` | ที่อยู่ใบกำกับภาษี | Tax invoice address |
| `postal` | รหัสไปรษณีย์ | Postal code |
| `postalPh` | เช่น 10200 | e.g. 10200 |
| `postalDesc` | พิมพ์ 5 หลัก ระบบจะเติมที่อยู่ให้ | Type 5 digits and we fill in the rest |
| `province` | จังหวัด | Province |
| `provincePh` | เลือกจังหวัด | Select province |
| `district` | อำเภอ/เขต | District |
| `districtPh` | เลือกอำเภอ/เขต | Select district |
| `amphoe` | อำเภอ | District |
| `khet` | เขต | District (khet) |
| `subdistrict` | ตำบล/แขวง | Subdistrict |
| `subdistrictPh` | เลือกตำบล/แขวง | Select subdistrict |
| `tambon` | ตำบล | Subdistrict |
| `khwaeng` | แขวง | Subdistrict (khwaeng) |
| `chooseProvinceFirst` | เลือกจังหวัดก่อน | Select a province first |
| `chooseDistrictFirst` | เลือก{k}ก่อน | Select a district first |
| `searchHere` | ค้นหา{k}… | Search {k}… |
| `autofilled` | เติมจากรหัสไปรษณีย์ {pc} | Filled from postal code {pc} |
| `undo` | ล้าง | Clear |
| `pickOne` | รหัส {pc} ใช้ได้ {n} {k} เลือก{k}ของคุณ | {pc} covers {n} subdistricts. Pick yours. |
| `pickArea` | รหัส {pc} ใช้ได้ {n} พื้นที่ใน {p} จังหวัด เลือกพื้นที่ของคุณ | {pc} covers {n} areas in {p} provinces. Pick yours. |
| `pickAreaOneProvince` | รหัส {pc} ใช้ได้ {n} พื้นที่ใน {d} อำเภอ เลือกพื้นที่ของคุณ | {pc} covers {n} areas in {d} districts. Pick yours. |
| `facilityTitle` | {pc} เป็นรหัสไปรษณีย์ของหน่วยงาน | {pc} is a facility postal code |
| `facilityBody` | {note} ใช้กับที่อยู่ทั่วไปไม่ได้ ตรวจรหัสอีกครั้ง หรือเลือกพื้นที่ด้านล่าง | {note}. It isn't used for ordinary addresses. Check the code, or pick the area below. |
| `facilityUse` | ใช้รหัสนี้ต่อ | Use this code anyway |
| `notFoundTitle` | ไม่พบรหัสไปรษณีย์ {pc} | No postal code {pc} |
| `notFoundBody` | ตรวจตัวเลขอีกครั้ง หรือเลือกจังหวัด อำเภอ และตำบลด้านล่างได้เลย | Check the digits, or pick the province, district and subdistrict below. |
| `postalForArea` | รหัสไปรษณีย์ของพื้นที่นี้ | Postal code for this area |
| `postalChoice` | พื้นที่นี้มีรหัสไปรษณีย์ {n} รหัส เลือกรหัสที่ใช้กับที่อยู่ของคุณ | This area has {n} postal codes. Pick the one for your address. |
| `search` | ค้นหาที่อยู่ | Find your address |
| `searchPh` | พิมพ์ตำบล อำเภอ จังหวัด หรือรหัสไปรษณีย์ | Type a subdistrict, district, province or postal code |
| `searchDesc` | พิมพ์ไทยหรืออังกฤษก็ได้ ไม่ต้องพิมพ์ ต./อ./จ. | Thai or English. No need to type ต./อ./จ. |
| `searchMore` | พิมพ์เพิ่มเพื่อให้ผลแคบลง | Keep typing to narrow the list |
| `searchEmpty` | ไม่พบ “{s}” | No match for “{s}” |
| `searchEmptyBody` | ลองพิมพ์ชื่ออำเภอ ชื่อจังหวัด หรือรหัสไปรษณีย์ หรือกรอกเองด้านล่าง | Try a district, a province or a postal code, or fill the fields below yourself. |
| `fillManually` | กรอกเอง | Fill in manually |
| `sameAs` | ใช้ที่อยู่เดียวกับที่อยู่จัดส่ง | Same as shipping address |
| `sameAsDesc` | เลิกเลือกเพื่อกรอกที่อยู่ใบกำกับภาษีแยก ระบบจะคัดลอกที่อยู่จัดส่งมาให้แก้ต่อ | Untick to enter a separate tax invoice address. We copy the shipping address in for you to edit. |
| `loading` | กำลังโหลดข้อมูลที่อยู่… | Loading address data… |
| `errorTitle` | โหลดข้อมูลที่อยู่ไม่สำเร็จ | Couldn't load address data |
| `errorBody` | ตรวจการเชื่อมต่อแล้วลองอีกครั้ง ข้อมูลที่กรอกไว้ยังอยู่ครบ | Check your connection and try again. What you entered is kept. |
| `retry` | ลองอีกครั้ง | Try again |
| `errMismatch` | รหัสไปรษณีย์นี้ไม่ตรงกับตำบล/แขวงที่เลือก | This postal code doesn't serve the selected subdistrict |
| `errRequired` | กรุณาเลือก{f} | Select a {f} |
| `line` | บ้านเลขที่ ถนน ซอย | House no., street, soi |
| `hostField` | ช่องของแอปผู้ใช้ ไม่ใช่ส่วนของคอมโพเนนต์ | Host app's own field, not part of the component |
| `showFacility` | แสดงรหัสไปรษณีย์ของหน่วยงาน | Show facility postal codes |
| `pick` | เลือก{k} | Select {k} |
